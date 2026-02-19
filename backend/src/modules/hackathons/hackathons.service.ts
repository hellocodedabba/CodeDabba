import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThanOrEqual, In, DataSource, IsNull } from 'typeorm';
import { Hackathon, HackathonStatus } from '../../entities/hackathon.entity';
import { HackathonRound, RoundStatus } from '../../entities/hackathon-round.entity';
import { HackathonRegistration, RegistrationType } from '../../entities/hackathon-registration.entity';
import { HackathonTeam, TeamStatus } from '../../entities/hackathon-team.entity';
import { HackathonTeamInvitation, InvitationStatus } from '../../entities/hackathon-team-invitation.entity';
import { HackathonMentor, MentorAssignmentType } from '../../entities/hackathon-mentor.entity';
import { HackathonTeamMentorAssignment } from '../../entities/hackathon-team-mentor-assignment.entity';
import { HackathonTeamMember, TeamMemberRole } from '../../entities/hackathon-team-member.entity';
import { HackathonSubmission } from '../../entities/hackathon-submission.entity';
import { HackathonScore } from '../../entities/hackathon-score.entity';
import { HackathonLeaderboard } from '../../entities/hackathon-leaderboard.entity';
import { User, Role } from '../../entities/user.entity';
import { CreateHackathonDto } from './dto/create-hackathon.dto';
import { RegisterHackathonDto, RegisterMemberDto } from './dto/register-hackathon.dto';
import { v4 as uuid } from 'uuid';
import * as cloudinary from 'cloudinary';

@Injectable()
export class HackathonsService {
    private readonly logger = new Logger(HackathonsService.name);
    constructor(
        @InjectRepository(Hackathon)
        private hackathonsRepository: Repository<Hackathon>,
        @InjectRepository(HackathonRound)
        private roundsRepository: Repository<HackathonRound>,
        @InjectRepository(HackathonRegistration)
        private registrationsRepository: Repository<HackathonRegistration>,
        @InjectRepository(HackathonTeam)
        private teamsRepository: Repository<HackathonTeam>,
        @InjectRepository(HackathonTeamInvitation)
        private invitationsRepository: Repository<HackathonTeamInvitation>,
        @InjectRepository(HackathonMentor)
        private mentorsRepository: Repository<HackathonMentor>,
        @InjectRepository(HackathonTeamMentorAssignment)
        private teamMentorAssignmentsRepository: Repository<HackathonTeamMentorAssignment>,
        @InjectRepository(HackathonTeamMember)
        private teamMembersRepository: Repository<HackathonTeamMember>,
        @InjectRepository(HackathonSubmission)
        private submissionsRepository: Repository<HackathonSubmission>,
        @InjectRepository(HackathonScore)
        private scoresRepository: Repository<HackathonScore>,
        @InjectRepository(HackathonLeaderboard)
        private leaderboardRepository: Repository<HackathonLeaderboard>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private dataSource: DataSource,
        private readonly mailerService: MailerService,
    ) { }

    @Cron(CronExpression.EVERY_MINUTE)
    async handleCron() {
        const now = new Date();

        // 1. Hackathon Level: Registration Closing
        const toClose = await this.hackathonsRepository.find({
            where: {
                status: HackathonStatus.REGISTRATION_OPEN,
                registrationEnd: LessThanOrEqual(now)
            }
        });

        for (const hackathon of toClose) {
            hackathon.status = HackathonStatus.REGISTRATION_CLOSED;
            await this.hackathonsRepository.save(hackathon);
            await this.transitionToTeamsForming(hackathon.id);
        }

        // 2. Round Level: Status Transitions
        const allRounds = await this.roundsRepository.find({
            relations: ['hackathon'],
            order: { hackathonId: 'ASC', roundNumber: 'ASC' }
        });

        const hackathonRoundsMap = new Map<string, HackathonRound[]>();
        allRounds.forEach(r => {
            const list = hackathonRoundsMap.get(r.hackathonId) || [];
            list.push(r);
            hackathonRoundsMap.set(r.hackathonId, list);
        });

        for (const [hackathonId, rounds] of hackathonRoundsMap.entries()) {
            for (let i = 0; i < rounds.length; i++) {
                const round = rounds[i];
                const nextRound = rounds[i + 1];
                let statusChanged = false;

                // upcoming -> active
                if (round.status === RoundStatus.UPCOMING && now >= round.startDate && now < round.endDate) {
                    round.status = RoundStatus.ACTIVE;
                    statusChanged = true;
                }
                // active -> judging
                else if (round.status === RoundStatus.ACTIVE && now >= round.endDate) {
                    round.status = RoundStatus.JUDGING;
                    statusChanged = true;
                }
                // judging -> closed (automatic finalization if next round starts or 48h passed)
                else if (round.status === RoundStatus.JUDGING && !round.isScoringFinalized) {
                    const shouldFinalize = (nextRound && now >= nextRound.startDate) ||
                        (now.getTime() - round.endDate.getTime() > 48 * 60 * 60 * 1000);

                    if (shouldFinalize) {
                        this.logger.log(`Automatically finalizing round ${round.title}`);
                        try {
                            await this.performRoundFinalization(round.id);
                        } catch (e) {
                            this.logger.error(`Failed to auto-finalize round ${round.id}: ${e.message}`);
                        }
                    }
                }

                if (statusChanged) {
                    await this.roundsRepository.save(round);
                    console.log(`Round ${round.title} (ID: ${round.id}) transitioned to ${round.status}`);

                    if (round.status === RoundStatus.ACTIVE) {
                        const hackathon = await this.hackathonsRepository.findOne({ where: { id: hackathonId } });
                        if (hackathon && hackathon.status === HackathonStatus.READY_FOR_ROUND_1) {
                            hackathon.status = HackathonStatus.ROUND_ACTIVE;
                            await this.hackathonsRepository.save(hackathon);
                        }
                    }
                }
            }
        }

        // 3. Expire invitations
        await this.invitationsRepository.update(
            { status: InvitationStatus.PENDING, expiresAt: LessThanOrEqual(now) },
            { status: InvitationStatus.EXPIRED }
        );
    }

    async create(user: User, createHackathonDto: CreateHackathonDto): Promise<Hackathon> {
        if (user.role !== Role.ADMIN) {
            throw new ForbiddenException('Only admins can create hackathons');
        }

        const { rounds, ...hackathonData } = createHackathonDto;

        const hackathon = this.hackathonsRepository.create({
            ...hackathonData,
            createdById: user.id,
            status: HackathonStatus.DRAFT,
            rounds: rounds.map((round, index) => ({
                ...round,
                roundNumber: index + 1
            }))
        });

        return await this.hackathonsRepository.save(hackathon);
    }

    async findAll(query: any = {}, userId?: string): Promise<any[]> {
        const { status } = query;
        const where: any = {};
        if (status) {
            where.status = status;
        }

        const hackathons = await this.hackathonsRepository.find({
            where,
            relations: ['rounds'],
            order: { createdAt: 'DESC' }
        });

        if (!userId) return hackathons;

        const myRegistrations = await this.registrationsRepository.find({
            where: { studentId: userId }
        });

        const registeredIds = new Set(myRegistrations.map(r => r.hackathonId));

        return hackathons.map(h => ({
            ...h,
            isRegistered: registeredIds.has(h.id)
        }));
    }

    async findOne(id: string, userId?: string): Promise<any> {
        const hackathon = await this.hackathonsRepository.findOne({
            where: { id },
            relations: ['rounds', 'createdBy', 'mentors', 'mentors.mentor']
        });
        if (!hackathon) throw new NotFoundException('Hackathon not found');

        let registration: HackathonRegistration | null = null;
        if (userId) {
            registration = await this.registrationsRepository.findOne({
                where: { hackathonId: id, studentId: userId },
                relations: ['team']
            });
        }

        return {
            ...hackathon,
            userRegistration: registration ? {
                ...registration,
                teamStatus: registration.team?.status,
                rejectReason: registration.team?.rejectReason
            } : null
        };
    }

    async getHackathonTeams(hackathonId: string) {
        return await this.teamsRepository.find({
            where: { hackathonId },
            relations: ['lead', 'members', 'members.student']
        });
    }

    async updateStatus(user: User, id: string, status: HackathonStatus): Promise<Hackathon> {
        if (user.role !== Role.ADMIN) {
            throw new ForbiddenException('Admin only');
        }

        const hackathon = await this.hackathonsRepository.findOne({ where: { id } });
        if (!hackathon) throw new NotFoundException('Hackathon not found');

        hackathon.status = status;
        await this.hackathonsRepository.save(hackathon);
        return hackathon;
    }

    async distributeTeamsToMentors(user: User, hackathonId: string) {
        if (user.role !== Role.ADMIN) throw new ForbiddenException('Admin only');

        const hackathon = await this.hackathonsRepository.findOne({ where: { id: hackathonId } });
        if (!hackathon) throw new NotFoundException('Hackathon not found');
        if (hackathon.isMentorDistributed) throw new BadRequestException('Personnel distribution already finalized');

        const result = await this.performMentorDistribution(hackathonId);

        hackathon.isMentorDistributed = true;
        await this.hackathonsRepository.save(hackathon);

        return result;
    }

    private async performMentorDistribution(hackathonId: string) {
        // 1. Get all mentors for this hackathon
        const mentors = await this.mentorsRepository.find({
            where: { hackathonId },
            relations: ['mentor']
        });

        if (mentors.length === 0) return {
            message: 'No mentors registered for this hackathon',
            assignedSquads: 0,
            personnelCount: 0,
            ratio: "0"
        };

        // 2. Get all teams pending distribution (status PENDING_APPROVAL)
        const teams = await this.teamsRepository.find({
            where: { hackathonId, status: TeamStatus.PENDING_APPROVAL }
        });

        if (teams.length === 0) return {
            message: 'No squads requiring assignment',
            assignedSquads: 0,
            personnelCount: mentors.length,
            ratio: "0"
        };

        // 3. Clear existing specific assignments for THESE teams to avoid duplicates/confusion
        const teamIds = teams.map(t => t.id);
        await this.teamMentorAssignmentsRepository.delete({ teamId: In(teamIds) });

        // 4. Shuffle both for max randomness
        const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
        const shuffledMentors = [...mentors].sort(() => Math.random() - 0.5);

        // 5. Equally divide
        const assignments: HackathonTeamMentorAssignment[] = [];
        shuffledTeams.forEach((team, index) => {
            const mentor = shuffledMentors[index % shuffledMentors.length];
            const assignment = this.teamMentorAssignmentsRepository.create({
                teamId: team.id,
                mentorId: mentor.mentorId
            });
            assignments.push(assignment);
        });

        if (assignments.length > 0) {
            await this.teamMentorAssignmentsRepository.save(assignments);
        }

        return {
            assignedSquads: assignments.length,
            personnelCount: mentors.length,
            ratio: mentors.length > 0 ? (assignments.length / mentors.length).toFixed(1) : "0"
        };
    }
    async register(user: User, hackathonId: string, registerDto: RegisterHackathonDto): Promise<any> {
        const hackathon = await this.hackathonsRepository.findOne({
            where: { id: hackathonId },
            relations: ['rounds']
        });

        if (!hackathon) throw new NotFoundException('Hackathon not found');
        if (hackathon.status !== HackathonStatus.REGISTRATION_OPEN) {
            throw new BadRequestException('Registration is not open for this hackathon');
        }

        const now = new Date();
        if (now < hackathon.registrationStart) {
            throw new BadRequestException(`Registration hasn't started yet. It starts on ${hackathon.registrationStart.toLocaleString()}`);
        }
        if (now > hackathon.registrationEnd) {
            throw new BadRequestException(`Registration period ended on ${hackathon.registrationEnd.toLocaleString()}`);
        }

        // Check participant cap
        if (hackathon.maxParticipants > 0) {
            const currentParticipants = await this.registrationsRepository.count({
                where: { hackathonId }
            });
            if (currentParticipants >= hackathon.maxParticipants) {
                throw new BadRequestException('The arena is full! Maximum participation limit reached.');
            }
        }

        // Check if already registered
        const existing = await this.registrationsRepository.findOne({
            where: { hackathonId, studentId: user.id }
        });
        if (existing) throw new ConflictException('You are already registered for this hackathon');

        console.log(`Processing registration for ${user.email} for hackathon ${hackathon.title}`);
        console.log('Registration Data:', JSON.stringify(registerDto, null, 2));

        // Check if has pending invitations (to prevent double joining)
        const pendingInvite = await this.invitationsRepository.findOne({
            where: { hackathonId, invitedEmail: user.email, status: InvitationStatus.PENDING }
        });
        if (pendingInvite) throw new ConflictException('You have a pending invitation for this hackathon. Please accept or decline it first.');

        // Individual registration
        if (registerDto.registrationType === RegistrationType.INDIVIDUAL) {
            if (!hackathon.allowIndividual) throw new BadRequestException('Individual registration not allowed');

            const registration = this.registrationsRepository.create({
                hackathonId,
                studentId: user.id,
                registrationType: RegistrationType.INDIVIDUAL,
                status: 'registered',
                name: registerDto.name,
                mobile: registerDto.mobile,
                collegeEmail: registerDto.collegeEmail,
                highestQualification: registerDto.highestQualification
            });
            return await this.registrationsRepository.save(registration);
        }

        // Team registration
        if (registerDto.registrationType === RegistrationType.TEAM) {
            if (!hackathon.allowTeam) throw new BadRequestException('Team registration not allowed');

            const teamMembers = registerDto.members || [];
            if (teamMembers.length + 1 > hackathon.maxTeamSize) {
                throw new BadRequestException(`Team size exceeds maximum limit of ${hackathon.maxTeamSize}`);
            }

            // Create Team
            const team = this.teamsRepository.create({
                hackathonId,
                name: registerDto.teamName,
                leadId: user.id,
                status: TeamStatus.FORMING
            });
            await this.teamsRepository.save(team);

            // Save lead registration
            const leadRegistration = this.registrationsRepository.create({
                hackathonId,
                studentId: user.id,
                registrationType: RegistrationType.TEAM,
                teamId: team.id,
                isTeamLead: true,
                status: 'registered',
                name: registerDto.name,
                mobile: registerDto.mobile,
                collegeEmail: registerDto.collegeEmail,
                highestQualification: registerDto.highestQualification
            });

            await this.registrationsRepository.save(leadRegistration);

            // Create member invitations
            const expiryDate = new Date();
            expiryDate.setHours(expiryDate.getHours() + 48);
            // Don't exceed registration end
            if (expiryDate > hackathon.registrationEnd) {
                expiryDate.setTime(hackathon.registrationEnd.getTime());
            }

            for (const memberDto of teamMembers) {
                // Check if member already invited/registered
                const alreadyInvited = await this.invitationsRepository.findOne({
                    where: { hackathonId, invitedEmail: memberDto.email }
                });
                if (alreadyInvited && alreadyInvited.status === InvitationStatus.PENDING) continue;

                const invitation = this.invitationsRepository.create({
                    hackathonId,
                    teamName: registerDto.teamName,
                    invitedEmail: memberDto.email,
                    invitedName: memberDto.name,
                    invitedMobile: memberDto.mobile,
                    invitedTrack: memberDto.collegeEmail || memberDto.highestQualification,
                    invitedById: user.id,
                    status: InvitationStatus.PENDING,
                    token: uuid(),
                    expiresAt: expiryDate
                });

                await this.invitationsRepository.save(invitation);

                // Send Email Invitation
                await this.sendHackathonInvitation(invitation, hackathon.title, user.name);
            }

            return { message: 'Registration successful. Squad summons dispatched.', teamId: team.id };
        }
    }

    private async sendHackathonInvitation(invitation: HackathonTeamInvitation, hackathonTitle: string, inviterName: string) {
        const appUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
        try {
            await this.mailerService.sendMail({
                to: invitation.invitedEmail,
                subject: `⚔️ You've Been Recruited for ${hackathonTitle}!`,
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 40px; background-color: #000; color: #fff; border-radius: 30px; border: 1px solid #333;">
                        <h2 style="color: #F0ABFC; font-style: italic; text-transform: uppercase;">The Arena Awaits</h2>
                        <p style="font-size: 16px; line-height: 1.6;">Hi <strong>${invitation.invitedName || 'Warrior'}</strong>,</p>
                        <p style="font-size: 16px; line-height: 1.6;">
                            <strong>${inviterName}</strong> has recruited you to join their squad <strong>"${invitation.teamName}"</strong> for the upcoming hackathon:
                        </p>
                        <h3 style="color: #fff; font-size: 24px; text-transform: uppercase; margin: 30px 0;">🏆 ${hackathonTitle}</h3>
                        <p style="font-size: 14px; color: #888; margin-bottom: 40px;">You have been enlisted as part of this squad. Secure your spot by clicking the button below.</p>
                        
                        <a href="${appUrl}/hackathons/invitations?token=${invitation.token}" style="display: inline-block; padding: 18px 36px; background-color: #F0ABFC; color: #000; text-decoration: none; border-radius: 12px; font-weight: 900; text-transform: uppercase; font-style: italic; letter-spacing: 1px;">Accept Mission</a>
                        
                        <p style="margin-top: 50px; font-size: 12px; color: #555;">
                            This invitation expires on ${invitation.expiresAt.toLocaleString()}.<br>
                            If you do not have an account yet, sign up using this same email and your mission will be automatically synchronized.
                        </p>
                    </div>
                `
            });
        } catch (error) {
            console.error('Failed to send hackathon invitation email:', error);
        }
    }

    async syncInvitations(userId: string, email: string) {
        // No direct sync needed anymore since we match by email in getInvitations
        console.log(`Syncing invitations for ${email}`);
    }

    async getInvitations(email: string) {
        return await this.invitationsRepository.find({
            where: { invitedEmail: email, status: InvitationStatus.PENDING },
            relations: ['hackathon', 'invitedBy']
        });
    }

    async acceptInvitation(user: User, invitationIdOrToken: string) {
        return await this.dataSource.transaction(async (manager) => {
            const invitationRepo = manager.getRepository(HackathonTeamInvitation);
            const registrationRepo = manager.getRepository(HackathonRegistration);
            const teamRepo = manager.getRepository(HackathonTeam);
            const hackathonRepo = manager.getRepository(Hackathon);

            const invitation = await invitationRepo.findOne({
                where: [
                    { id: invitationIdOrToken, invitedEmail: user.email, status: InvitationStatus.PENDING },
                    { token: invitationIdOrToken, invitedEmail: user.email, status: InvitationStatus.PENDING }
                ],
                relations: ['hackathon']
            });

            if (!invitation) throw new NotFoundException('Invitation not found or no longer active');

            // 1. Check if hackathon registration is still open (both date and status)
            const hackathon = invitation.hackathon;
            const now = new Date();
            if (hackathon.status !== HackathonStatus.REGISTRATION_OPEN || now > hackathon.registrationEnd) {
                // Auto-expire invitation if we tried to accept it but reg is closed
                invitation.status = InvitationStatus.EXPIRED;
                await invitationRepo.save(invitation);
                throw new BadRequestException('Registration for this hackathon is closed');
            }

            if (invitation.expiresAt < now) {
                invitation.status = InvitationStatus.EXPIRED;
                await invitationRepo.save(invitation);
                throw new BadRequestException('Invitation has expired');
            }

            // 2. Find or create team (Atomic)
            let team = await teamRepo.findOne({
                where: { hackathonId: invitation.hackathonId, name: invitation.teamName }
            });

            if (!team) {
                team = teamRepo.create({
                    hackathonId: invitation.hackathonId,
                    name: invitation.teamName,
                    leadId: invitation.invitedById,
                    status: TeamStatus.FORMING
                });
                await teamRepo.save(team);
            }

            // 3. Team Slot Reservation Logic: Check team size within transaction
            const currentMembers = await registrationRepo.count({
                where: { teamId: team.id }
            });

            if (currentMembers >= hackathon.maxTeamSize) {
                throw new BadRequestException(`This squad is already at full capacity (${hackathon.maxTeamSize} warriors)`);
            }

            // 4. Multi-registration prevention
            const existingReg = await registrationRepo.findOne({
                where: { hackathonId: invitation.hackathonId, studentId: user.id }
            });
            if (existingReg) throw new ConflictException('You are already registered for this hackathon');

            // 5. Atomic acceptance
            invitation.status = InvitationStatus.ACCEPTED;
            invitation.acceptedAt = new Date();
            await invitationRepo.save(invitation);

            // Create registration record
            const registration = registrationRepo.create({
                hackathonId: invitation.hackathonId,
                studentId: user.id,
                registrationType: RegistrationType.TEAM,
                teamId: team.id,
                isTeamLead: false,
                status: 'registered',
                name: invitation.invitedName || user.name,
                mobile: invitation.invitedMobile,
                collegeEmail: invitation.invitedTrack?.includes('@') ? invitation.invitedTrack : undefined,
                highestQualification: !invitation.invitedTrack?.includes('@') ? invitation.invitedTrack : undefined
            });

            return await registrationRepo.save(registration);
        });
    }

    async declineInvitation(user: User, invitationId: string) {
        const invitation = await this.invitationsRepository.findOne({
            where: { id: invitationId, invitedEmail: user.email, status: InvitationStatus.PENDING }
        });
        if (!invitation) throw new NotFoundException('Invitation not found');

        invitation.status = InvitationStatus.DECLINED;
        return await this.invitationsRepository.save(invitation);
    }

    async getMyRegistrations(userId: string) {
        const registrations = await this.registrationsRepository.find({
            where: { studentId: userId },
            relations: ['hackathon', 'team'],
            order: { createdAt: 'DESC' }
        });

        return await Promise.all(registrations.map(async (reg) => {
            if (reg.teamId) {
                const members = await this.registrationsRepository.find({
                    where: { teamId: reg.teamId },
                    relations: ['student']
                });
                return {
                    ...reg,
                    teamName: reg.team?.name,
                    teamMembers: members.map(m => ({
                        id: m.student?.id,
                        name: m.name || m.student?.name,
                        email: m.student?.email,
                        isTeamLead: m.isTeamLead
                    }))
                };
            }
            return reg;
        }));
    }

    async getTeamDetails(userId: string, hackathonId: string) {
        const registration = await this.registrationsRepository.findOne({
            where: { hackathonId, studentId: userId, registrationType: RegistrationType.TEAM },
            relations: ['team', 'hackathon']
        });

        if (!registration || !registration.teamId) {
            throw new NotFoundException('Team registration not found');
        }

        const members = await this.registrationsRepository.find({
            where: { teamId: registration.teamId },
            relations: ['student']
        });

        const invitations = await this.invitationsRepository.find({
            where: { hackathonId, teamName: registration.team.name, status: InvitationStatus.PENDING }
        });

        return {
            team: registration.team,
            hackathon: registration.hackathon,
            isLead: registration.isTeamLead,
            members: members.map(m => ({
                id: m.id,
                studentId: m.student?.id,
                name: m.name || m.student?.name,
                email: m.student?.email || m.invitedEmail,
                isTeamLead: m.isTeamLead,
                joinedAt: m.createdAt
            })),
            invitations
        };
    }

    async inviteMember(user: User, hackathonId: string, memberDto: RegisterMemberDto) {
        const registration = await this.registrationsRepository.findOne({
            where: { hackathonId, studentId: user.id },
            relations: ['team', 'hackathon']
        });

        if (!registration || !registration.isTeamLead) {
            throw new ForbiddenException('Only the team lead can recruit new warriors');
        }

        const hackathon = registration.hackathon;
        const now = new Date();
        if (hackathon.status !== HackathonStatus.REGISTRATION_OPEN && now > hackathon.endDate) {
            throw new BadRequestException('The battlefield is closed. No more recruits allowed.');
        }

        const currentMembers = await this.registrationsRepository.count({
            where: { teamId: registration.teamId }
        });
        const pendingInvites = await this.invitationsRepository.count({
            where: { hackathonId, teamName: registration.team.name, status: InvitationStatus.PENDING }
        });

        if (currentMembers + pendingInvites >= hackathon.maxTeamSize) {
            throw new BadRequestException(`Team capacity reached (${hackathon.maxTeamSize} warriors max including pending invites)`);
        }

        // Check if user is already registered for this hackathon
        const existingStudent = await this.usersRepository.findOne({ where: { email: memberDto.email } });
        if (existingStudent) {
            const existingReg = await this.registrationsRepository.findOne({
                where: { hackathonId, studentId: existingStudent.id }
            });
            if (existingReg) throw new ConflictException('This warrior is already enlisted in another squad');
        }

        // Check for existing pending/accepted invitation (to avoid unique constraint error)
        const existingInvite = await this.invitationsRepository.findOne({
            where: { hackathonId, invitedEmail: memberDto.email }
        });

        if (existingInvite) {
            if (existingInvite.status === InvitationStatus.PENDING) {
                throw new ConflictException('A summons has already been sent to this warrior');
            }
            if (existingInvite.status === InvitationStatus.ACCEPTED) {
                throw new ConflictException('This warrior has already accepted a summons for this battlefield');
            }
            // If declined or expired, we can potentially reuse or delete/recreate. 
            // For now, let's delete if it's not pending/accepted so we can re-invite.
            await this.invitationsRepository.remove(existingInvite);
        }

        // Create Invitation
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 48);
        if (expiryDate > hackathon.registrationEnd) {
            expiryDate.setTime(hackathon.registrationEnd.getTime());
        }

        const invitation = this.invitationsRepository.create({
            hackathonId,
            teamName: registration.team.name,
            invitedEmail: memberDto.email,
            invitedName: memberDto.name,
            invitedMobile: memberDto.mobile,
            invitedTrack: memberDto.collegeEmail || memberDto.highestQualification,
            invitedById: user.id,
            status: InvitationStatus.PENDING,
            token: uuid(),
            expiresAt: expiryDate
        });

        await this.invitationsRepository.save(invitation);
        await this.sendHackathonInvitation(invitation, hackathon.title, user.name);

        return invitation;
    }

    async removeMember(user: User, hackathonId: string, registrationId: string) {
        const leadReg = await this.registrationsRepository.findOne({
            where: { hackathonId, studentId: user.id },
            relations: ['hackathon']
        });

        if (!leadReg || !leadReg.isTeamLead) {
            throw new ForbiddenException('Only the lead can exile members');
        }

        if (new Date() > leadReg.hackathon.endDate) {
            throw new BadRequestException('The mission has concluded. Squad composition is frozen.');
        }

        const targetReg = await this.registrationsRepository.findOne({
            where: { id: registrationId, teamId: leadReg.teamId }
        });

        if (!targetReg) throw new NotFoundException('Member not found in your squad');
        if (targetReg.studentId === user.id) throw new BadRequestException('The lead cannot abandon their own squad. Pass leadership or disband instead.');

        return await this.registrationsRepository.remove(targetReg);
    }

    async revokeInvitation(user: User, hackathonId: string, invitationId: string) {
        const leadReg = await this.registrationsRepository.findOne({
            where: { hackathonId, studentId: user.id }
        });

        if (!leadReg || !leadReg.isTeamLead) {
            throw new ForbiddenException('Only the lead can revoke summons');
        }

        const invitation = await this.invitationsRepository.findOne({
            where: { id: invitationId, hackathonId, invitedById: user.id, status: InvitationStatus.PENDING }
        });

        if (!invitation) throw new NotFoundException('Summons not found or already processed');

        invitation.status = InvitationStatus.DECLINED; // Or just delete it? Declined is fine.
        return await this.invitationsRepository.save(invitation);
    }

    async transitionToTeamsForming(hackathonId: string) {
        const hackathon = await this.hackathonsRepository.findOne({ where: { id: hackathonId } });
        if (!hackathon) return;

        hackathon.status = HackathonStatus.TEAMS_FORMING;
        await this.hackathonsRepository.save(hackathon);

        await this.finalizeTeams(hackathonId);
    }

    async finalizeTeams(hackathonId: string) {
        return await this.dataSource.transaction(async (manager) => {
            const hRepo = manager.getRepository(Hackathon);
            const regRepo = manager.getRepository(HackathonRegistration);
            const teamRepo = manager.getRepository(HackathonTeam);
            const inviteRepo = manager.getRepository(HackathonTeamInvitation);
            const teamMemberRepo = manager.getRepository(HackathonTeamMember);

            const hackathon = await hRepo.findOne({ where: { id: hackathonId } });
            if (!hackathon) throw new NotFoundException('Hackathon not found');

            // 1. Expire all pending invitations
            await inviteRepo.update(
                { hackathonId, status: InvitationStatus.PENDING },
                { status: InvitationStatus.EXPIRED }
            );

            // 2. Handle Individual Registrations (Solo Teams)
            const individuals = await regRepo.find({
                where: { hackathonId, registrationType: RegistrationType.INDIVIDUAL, status: 'registered' },
                relations: ['student']
            });

            for (const ind of individuals) {
                // Create a solo team
                const team = teamRepo.create({
                    hackathonId,
                    name: ind.student?.name || ind.name || 'Solo Participant',
                    leadId: ind.studentId,
                    status: TeamStatus.PENDING_APPROVAL,
                    isLocked: false
                });
                await teamRepo.save(team);

                // Add as leader in team_members
                const member = teamMemberRepo.create({
                    teamId: team.id,
                    studentId: ind.studentId,
                    role: TeamMemberRole.LEADER
                });
                await teamMemberRepo.save(member);

                // Update registration to link to team
                ind.teamId = team.id;
                ind.registrationType = RegistrationType.TEAM;
                ind.isTeamLead = true;
                await regRepo.save(ind);
            }

            // 3. Finalize Existing Teams (Teams created via Invitation)
            const teams = await teamRepo.find({
                where: { hackathonId, status: TeamStatus.FORMING }
            });

            for (const team of teams) {
                const members = await regRepo.find({
                    where: { teamId: team.id }
                });

                if (members.length >= 1) {
                    team.status = TeamStatus.PENDING_APPROVAL;
                    team.isLocked = false;
                    await teamRepo.save(team);

                    // Sync into team_members table
                    for (const m of members) {
                        const teamMember = teamMemberRepo.create({
                            teamId: team.id,
                            studentId: m.studentId,
                            role: m.isTeamLead ? TeamMemberRole.LEADER : TeamMemberRole.MEMBER
                        });
                        await teamMemberRepo.save(teamMember);
                    }
                } else {
                    // Empty team? Reject or delete. Let's reject.
                    team.status = TeamStatus.REJECTED;
                    team.rejectReason = 'Team had no confirmed members';
                    await teamRepo.save(team);
                }
            }

            // 5. Perform Automatic Mentor Distribution
            try {
                const distributionResult = await this.performMentorDistribution(hackathonId);
                hackathon.isMentorDistributed = true;
                await hRepo.save(hackathon);
                console.log(`Automatically distributed teams for hackathon ${hackathonId}:`, distributionResult);
            } catch (distError) {
                console.error(`Automatic distribution failed for ${hackathonId}:`, distError);
            }

            console.log(`Finalized teams for hackathon ${hackathonId}. Status: ${hackathon.status}`);
        });
    }


    async getAvailableMentors(hackathonId: string) {
        // 1. Get all mentors
        const allMentors = await this.usersRepository.find({
            where: { role: Role.MENTOR }
        });

        // 2. Get already assigned mentors
        const assigned = await this.mentorsRepository.find({
            where: { hackathonId }
        });
        const assignedIds = new Set(assigned.map(a => a.mentorId));

        // 3. Filter
        return allMentors.filter(m => !assignedIds.has(m.id));
    }

    async assignMentors(hackathonId: string, mentorIds: string[], type: MentorAssignmentType) {
        // 1. Get existing assignments to avoid duplicates
        const existing = await this.mentorsRepository.find({
            where: { hackathonId, mentorId: In(mentorIds) }
        });
        const existingMentorIds = new Set(existing.map(e => e.mentorId));

        // 2. Filter out already assigned mentors
        const newMentorIds = mentorIds.filter(id => !existingMentorIds.has(id));

        if (newMentorIds.length === 0) {
            return { message: 'All selected personnel already recruited for this mission.', count: 0 };
        }

        const assignments = newMentorIds.map(mId => this.mentorsRepository.create({
            hackathonId,
            mentorId: mId,
            assignmentType: type
        }));

        await this.mentorsRepository.save(assignments);
        return { message: `${newMentorIds.length} new mentors recruited.`, count: newMentorIds.length };
    }

    async removeMentor(hackathonId: string, mentorId: string) {
        const assignment = await this.mentorsRepository.findOne({
            where: { hackathonId, mentorId }
        });

        if (!assignment) {
            throw new NotFoundException('Mentor not found in this hackathon');
        }

        await this.mentorsRepository.remove(assignment);
        return { message: 'Mentor removed from mission roster.' };
    }

    async assignMentorToTeam(hackathonId: string, mentorId: string, teamId: string) {
        const mentorConfig = await this.mentorsRepository.findOne({
            where: { hackathonId, mentorId }
        });

        if (!mentorConfig) throw new BadRequestException('Mentor must be assigned to hackathon first');

        const existing = await this.teamMentorAssignmentsRepository.findOne({
            where: { teamId, mentorId }
        });

        if (existing) return existing;

        const assignment = this.teamMentorAssignmentsRepository.create({
            teamId,
            mentorId
        });
        return await this.teamMentorAssignmentsRepository.save(assignment);
    }

    async getTeamApprovalList(user: User, hackathonId: string) {
        // Admins can see all pending teams
        if (user.role === Role.ADMIN) {
            return await this.teamsRepository.find({
                where: { hackathonId, status: TeamStatus.PENDING_APPROVAL },
                relations: ['lead', 'hackathon']
            });
        }

        // Mentors only see teams specifically assigned to them for review
        const specificAssignments = await this.teamMentorAssignmentsRepository.find({
            where: { mentorId: user.id },
            relations: ['team', 'team.lead', 'team.hackathon']
        });

        return specificAssignments
            .map(a => a.team)
            .filter(t => t.hackathonId === hackathonId && t.status === TeamStatus.PENDING_APPROVAL);
    }

    async getMentorHackathons(mentorId: string) {
        const assignments = await this.mentorsRepository.find({
            where: { mentorId },
            relations: ['hackathon']
        });

        const hackathonMap = new Map();

        assignments.forEach(a => {
            if (!a.hackathon) return;
            const existing = hackathonMap.get(a.hackathon.id);
            // Prioritize GLOBAL if multiple assignments exist
            if (!existing || a.assignmentType === MentorAssignmentType.GLOBAL) {
                hackathonMap.set(a.hackathon.id, {
                    ...a.hackathon,
                    assignmentType: a.assignmentType
                });
            }
        });

        return Array.from(hackathonMap.values());
    }

    async getMentorTeams(mentorId: string, hackathonId: string) {
        const assignments = await this.teamMentorAssignmentsRepository.find({
            where: { mentorId },
            relations: ['team', 'team.lead', 'team.members', 'team.members.student', 'team.hackathon']
        });

        return assignments
            .map(a => a.team)
            .filter(t => t && t.hackathonId === hackathonId);
    }

    async approveTeam(user: User, teamId: string) {
        const team = await this.teamsRepository.findOne({ where: { id: teamId }, relations: ['hackathon', 'lead'] });
        if (!team) throw new NotFoundException('Team not found');

        if (user.role !== Role.ADMIN) {
            const assigned = await this.teamMentorAssignmentsRepository.findOne({
                where: { teamId, mentorId: user.id }
            });
            if (!assigned) throw new ForbiddenException('This squad is not assigned to you for review');
        }

        team.status = TeamStatus.APPROVED;
        team.isLocked = true;
        team.approvedAt = new Date();
        team.approvedById = user.id;
        await this.teamsRepository.save(team);

        // Send Approval Email
        try {
            const teamMembers = await this.teamMembersRepository.find({
                where: { teamId: team.id },
                relations: ['student']
            });

            const emails = [team.lead.email, ...teamMembers.map(m => m.student?.email)].filter(Boolean);
            // Deduplicate emails just in case
            const uniqueEmails = Array.from(new Set(emails));

            await this.mailerService.sendMail({
                to: uniqueEmails,
                subject: `Squad Deployment Approved: ${team.hackathon.title}`,
                html: `
                <div style="font-family: Arial, sans-serif; background: #000; color: #fff; padding: 40px; border-radius: 20px; border: 1px solid #10b981;">
                    <h2 style="color: #10b981; text-transform: uppercase; letter-spacing: 2px;">Deployment Confirmed</h2>
                    <p style="font-size: 16px;">Greetings, <strong>${team.name}</strong> Operatives.</p>
                    <p>Your squad has been cleared by HQ for engagement in <strong>${team.hackathon.title}</strong>.</p>
                    <p>Prepare for round one protocols. Godspeed.</p>
                    <hr style="border: 0; border-top: 1px solid #333; margin: 20px 0;">
                    <p style="font-size: 12px; color: #666;">This is an automated transmission from CodeDabba Command Central.</p>
                </div>
            `
            });
        } catch (e) {
            console.error('Failed to send approval email', e);
        }

        await this.checkHackathonReady(team.hackathonId);
        return team;
    }

    async rejectTeam(user: User, teamId: string, reason: string) {
        const team = await this.teamsRepository.findOne({ where: { id: teamId }, relations: ['hackathon', 'lead'] });
        if (!team) throw new NotFoundException('Team not found');

        if (user.role !== Role.ADMIN) {
            const assigned = await this.teamMentorAssignmentsRepository.findOne({
                where: { teamId, mentorId: user.id }
            });
            if (!assigned) throw new ForbiddenException('This squad is not assigned to you for review');
        }

        team.status = TeamStatus.REJECTED;
        team.rejectReason = reason;
        team.isLocked = true;
        await this.teamsRepository.save(team);

        // Send Rejection Email
        try {
            const teamMembers = await this.teamMembersRepository.find({
                where: { teamId: team.id },
                relations: ['student']
            });

            const emails = [team.lead.email, ...teamMembers.map(m => m.student?.email)].filter(Boolean);
            const uniqueEmails = Array.from(new Set(emails));

            await this.mailerService.sendMail({
                to: uniqueEmails,
                subject: `Selection Update: ${team.hackathon.title}`,
                html: `
                <div style="font-family: Arial, sans-serif; background: #000; color: #fff; padding: 40px; border-radius: 20px; border: 1px solid #ef4444;">
                    <h2 style="color: #ef4444; text-transform: uppercase; letter-spacing: 2px;">Selection Update</h2>
                    <p style="font-size: 16px;">Greetings, <strong>${team.name}</strong> Operatives.</p>
                    <p>We regret to inform you that your squad was not selected for deployment in <strong>${team.hackathon.title}</strong> at this time.</p>
                    <div style="background: #111; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0; font-weight: bold; color: #ef4444;">Reason from Mentor:</p>
                        <p style="margin: 5px 0 0 0; color: #ccc; font-style: italic;">${reason}</p>
                    </div>
                    <p>Keep training. Your time will come.</p>
                    <hr style="border: 0; border-top: 1px solid #333; margin: 20px 0;">
                    <p style="font-size: 12px; color: #666;">This is an automated transmission from CodeDabba Command Central.</p>
                </div>
            `
            });
        } catch (e) {
            console.error('Failed to send rejection email', e);
        }

        await this.checkHackathonReady(team.hackathonId);
        return team;
    }

    async checkHackathonReady(hackathonId: string) {
        const pendingCount = await this.teamsRepository.count({
            where: { hackathonId, status: TeamStatus.PENDING_APPROVAL }
        });

        if (pendingCount === 0) {
            await this.hackathonsRepository.update(
                { id: hackathonId, status: HackathonStatus.APPROVAL_IN_PROGRESS },
                { status: HackathonStatus.READY_FOR_ROUND_1 }
            );
        }
    }

    async getTeamRoundStatus(teamId: string, hackathonId: string) {
        const team = await this.teamsRepository.findOne({
            where: { id: teamId },
            relations: ['members', 'members.student']
        });
        if (!team) throw new NotFoundException('Team not found');

        const rounds = await this.roundsRepository.find({
            where: { hackathonId },
            order: { roundNumber: 'ASC' }
        });

        // Determine current round (first active or first upcoming or last judging)
        const currentRound = rounds.find(r => r.status === RoundStatus.ACTIVE) ||
            rounds.find(r => r.status === RoundStatus.UPCOMING) ||
            rounds.filter(r => r.status === RoundStatus.JUDGING || r.status === RoundStatus.CLOSED).pop();

        if (!currentRound) return { team, currentRound: null, submissions: [] };

        const submissions = await this.submissionsRepository.find({
            where: { teamId, roundId: currentRound.id },
            order: { versionNumber: 'DESC' }
        });

        // Enrich submissions with scores if the round is in JUDGING or CLOSED
        const enrichedSubmissions: any[] = [];
        for (const sub of submissions) {
            if (currentRound.status === RoundStatus.JUDGING || currentRound.status === RoundStatus.CLOSED) {
                const scores = await this.scoresRepository.find({
                    where: { submissionId: sub.id },
                    relations: ['mentor']
                });
                enrichedSubmissions.push({
                    ...sub,
                    mentorScores: scores.map(s => ({
                        score: s.score,
                        remarks: s.remarks,
                        mentorName: s.mentor?.name || 'Anonymous Mentor'
                    }))
                });
            } else {
                enrichedSubmissions.push(sub);
            }
        }

        return {
            team,
            currentRound,
            submissions: enrichedSubmissions,
            isEliminated: team.status === TeamStatus.ELIMINATED
        };
    }

    async submitRound(user: User, teamId: string, roundId: string, dto: any, file?: any) {
        const now = new Date();

        // 1. Core Validations
        const team = await this.teamsRepository.findOne({ where: { id: teamId } });
        if (!team) throw new NotFoundException('Team not found');

        // Check if user is member/lead of the team
        const isMember = await this.teamMembersRepository.findOne({
            where: { teamId, studentId: user.id }
        });
        if (!isMember && team.leadId !== user.id && user.role !== Role.ADMIN) {
            throw new ForbiddenException('You are not authorized to submit for this squad');
        }

        const round = await this.roundsRepository.findOne({ where: { id: roundId } });
        if (!round) throw new NotFoundException('Mission parameters (round) not found');

        const hackathon = await this.hackathonsRepository.findOne({ where: { id: round.hackathonId } });
        if (!hackathon) throw new NotFoundException('Hackathon not found');

        // 2. State Rules
        if (team.status === TeamStatus.ELIMINATED) throw new BadRequestException('Squad has been eliminated from active duty');
        if (team.status !== TeamStatus.APPROVED) throw new BadRequestException('Squad eligibility not cleared for deployment');

        if (round.status !== RoundStatus.ACTIVE) {
            throw new BadRequestException(`Round is ${round.status}. Submissions are only accepted during ACTIVE status.`);
        }

        if (now > round.endDate) {
            throw new BadRequestException('Deadline has passed. External signal blocked.');
        }

        // 3. Round-Specific Requirements
        if (round.allowGithub && !dto.githubLink && !user.role.includes('ADMIN')) {
            // If strictly required? Let's say if allowed, one of them must be present or just validate what's there.
            // Requirement logic can be more complex, but for now let's just use what's sent.
        }

        let zipUrl = null;
        if (file && round.allowZip) {
            if (file.size > round.maxFileSizeMb * 1024 * 1024) {
                throw new BadRequestException(`Payload too large. Max: ${round.maxFileSizeMb} MB`);
            }
            // Cloudinary upload (simplified)
            try {
                const result = await new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.v2.uploader.upload_stream(
                        {
                            folder: `hackathons/${hackathon.id}/round-${round.roundNumber}/${team.name}`,
                            resource_type: 'auto',
                            public_id: `submission-v${Date.now()}`
                        },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );
                    uploadStream.end(file.buffer);
                });
                zipUrl = (result as any).secure_url;
            } catch (err) {
                throw new BadRequestException('Teleportation failed (File upload error)');
            }
        }

        // 4. Versioning Logic
        return await this.dataSource.transaction(async (manager) => {
            const subRepo = manager.getRepository(HackathonSubmission);

            // Mark previous as not final
            await subRepo.update(
                { teamId, roundId, isFinal: true },
                { isFinal: false }
            );

            // Get latest version number
            const lastSub = await subRepo.findOne({
                where: { teamId, roundId },
                order: { versionNumber: 'DESC' }
            });
            const nextVersion = lastSub ? lastSub.versionNumber + 1 : 1;

            const submission = subRepo.create({
                hackathonId: round.hackathonId,
                teamId,
                roundId,
                versionNumber: nextVersion,
                zipUrl: zipUrl || dto.zipUrl, // Support both direct upload and link
                githubLink: dto.githubLink,
                videoUrl: dto.videoUrl,
                description: dto.description,
                isFinal: true
            });

            const saved = await subRepo.save(submission);

            // Optional: Update Hackathon status to ROUND_ACTIVE if it was just READY
            if (hackathon.status === HackathonStatus.READY_FOR_ROUND_1) {
                await manager.getRepository(Hackathon).update(hackathon.id, { status: HackathonStatus.ROUND_ACTIVE });
            }

            return saved;
        });
    }

    async getTeamSubmissions(teamId: string, roundId: string) {
        return await this.submissionsRepository.find({
            where: { teamId, roundId },
            order: { versionNumber: 'DESC' }
        });
    }

    async evaluateSubmission(user: User, submissionId: string, score: number, feedback: string) {
        const submission = await this.submissionsRepository.findOne({
            where: { id: submissionId },
            relations: ['team', 'round', 'hackathon']
        });

        if (!submission) throw new NotFoundException('Submission not found');

        // Check if mentor is assigned to this team
        if (user.role !== Role.ADMIN) {
            // Check specific assignment
            const assignment = await this.teamMentorAssignmentsRepository.findOne({
                where: { teamId: submission.teamId, mentorId: user.id }
            });
            // If not specifically assigned, check if they are a mentor for the hackathon (Global)?
            // Usually grading is specific. Let's enforce specific or global assignment.

            if (!assignment) {
                const globalMentor = await this.mentorsRepository.findOne({
                    where: { hackathonId: submission.hackathonId, mentorId: user.id, assignmentType: MentorAssignmentType.GLOBAL }
                });
                if (!globalMentor) throw new ForbiddenException('You are not authorized to evaluate this squad');
            }
        }

        submission.score = score;
        submission.feedback = feedback;
        submission.evaluatedById = user.id;
        submission.evaluatedAt = new Date();

        await this.submissionsRepository.save(submission);

        // Notify Team Lead
        const team = submission.team;
        const lead = await this.usersRepository.findOne({ where: { id: team.leadId } }); // Assuming we can get lead details

        if (lead) {
            try {
                await this.mailerService.sendMail({
                    to: lead.email,
                    subject: `Mission Update: Round ${submission.round.roundNumber} Eval Received`,
                    html: `
                        <div style="font-family: Arial, sans-serif; background: #000; color: #fff; padding: 40px; border-radius: 20px; border: 1px solid #10b981;">
                            <h2 style="color: #10b981; text-transform: uppercase;">Evaluation Complete</h2>
                            <p>Your squad's submission for <strong>Round ${submission.round.roundNumber}</strong> has been processed.</p>
                            <div style="margin: 20px 0; padding: 20px; bg-color: #111; border: 1px solid #333;">
                                <p style="font-size: 24px; font-weight: bold; color: #fff;">Score: ${score}</p>
                                <p style="color: #ccc; font-style: italic;">"${feedback}"</p>
                            </div>
                             <p style="font-size: 12px; color: #666;">CodeDabba Command</p>
                        </div>
                    `
                });
            } catch (e) {
                console.error("Failed to send grade email", e);
            }
        }

        return submission;
    }

    async submitScore(user: User, submissionId: string, score: number, remarks: string) {
        const submission = await this.submissionsRepository.findOne({
            where: { id: submissionId },
            relations: ['team', 'round', 'hackathon']
        });

        if (!submission) throw new NotFoundException('Submission not found');
        if (submission.round.status !== RoundStatus.JUDGING) {
            throw new BadRequestException('Scoring protocol is only active during JUDGING phase');
        }

        // Check Authorization
        if (user.role !== Role.ADMIN) {
            const assignment = await this.teamMentorAssignmentsRepository.findOne({
                where: { teamId: submission.teamId, mentorId: user.id }
            });
            if (!assignment) {
                const globalMentor = await this.mentorsRepository.findOne({
                    where: { hackathonId: submission.hackathonId, mentorId: user.id, assignmentType: MentorAssignmentType.GLOBAL }
                });
                if (!globalMentor) throw new ForbiddenException('You are not authorized to judge this squad');
            }
        }

        // Save Score
        let hackathonScore = await this.scoresRepository.findOne({
            where: { submissionId, mentorId: user.id }
        });

        if (hackathonScore) {
            hackathonScore.score = score;
            hackathonScore.remarks = remarks;
        } else {
            hackathonScore = this.scoresRepository.create({
                hackathonId: submission.hackathonId,
                roundId: submission.roundId,
                submissionId,
                teamId: submission.teamId,
                mentorId: user.id,
                score,
                remarks
            });
        }

        await this.scoresRepository.save(hackathonScore);

        // Check if all assigned mentors have scored to update finalScore
        await this.calculateAndSaveFinalScore(submissionId);

        return hackathonScore;
    }

    private async calculateAndSaveFinalScore(submissionId: string) {
        const submission = await this.submissionsRepository.findOne({
            where: { id: submissionId },
            relations: ['team', 'round']
        });

        if (!submission) return;

        // Get all mentors assigned to this team
        const assignments = await this.teamMentorAssignmentsRepository.find({
            where: { teamId: submission.teamId }
        });

        // Get all scores for this submission
        const scores = await this.scoresRepository.find({
            where: { submissionId }
        });

        // If specific assignments exist, we wait for all of them
        const assignedMentorIds = assignments.map(a => a.mentorId);

        // If no specific assignments, check if there are any global mentors (this part is tricky if we don't know who is supposed to score)
        // For now, let's assume if there are specific assignments, we wait for all. 
        // If not, we take what we have when admin finalizes.

        if (assignedMentorIds.length > 0) {
            const scoredMentorIds = scores.map(s => s.mentorId);
            const allScored = assignedMentorIds.every(id => scoredMentorIds.includes(id));

            if (allScored) {
                const avgScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
                submission.finalScore = avgScore;
                submission.isScored = true;
                await this.submissionsRepository.save(submission);
            }
        } else {
            // If no specific assignments, maybe just one global mentor scores?
            // We'll calculate average of whatever scores exist when admin finalizes or if at least one exists.
            if (scores.length > 0) {
                const avgScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
                submission.finalScore = avgScore;
                submission.isScored = true;
                await this.submissionsRepository.save(submission);
            }
        }
    }

    async finalizeRound(user: User, roundId: string) {
        if (user.role !== Role.ADMIN) throw new ForbiddenException('Admin only');
        return await this.performRoundFinalization(roundId);
    }

    private async performRoundFinalization(roundId: string) {
        const round = await this.roundsRepository.findOne({
            where: { id: roundId },
            relations: ['hackathon', 'hackathon.rounds']
        });

        if (!round) throw new NotFoundException('Round not found');
        // If already finalized, just return (idempotent)
        if (round.isScoringFinalized) return;

        // Manual finalization might happen even if not in JUDGING if admin forces it, but auto only in JUDGING
        // For safety/consistency:
        // if (round.status !== RoundStatus.JUDGING) throw new BadRequestException('Round must be in JUDGING phase to finalize');

        await this.dataSource.transaction(async (manager) => {
            const submissionsRepo = manager.getRepository(HackathonSubmission);
            const teamsRepo = manager.getRepository(HackathonTeam);
            const scoresRepo = manager.getRepository(HackathonScore);
            const leaderboardRepo = manager.getRepository(HackathonLeaderboard);

            // 1. Process all approved teams for scores
            const teams = await teamsRepo.find({
                where: { hackathonId: round.hackathonId, status: TeamStatus.APPROVED }
            });

            const roundResults: any[] = [];

            for (const team of teams) {
                const submission = await submissionsRepo.findOne({
                    where: { teamId: team.id, roundId: round.id, isFinal: true }
                });

                let roundScore = 0;
                let submissionTimestamp = submission?.submittedAt || new Date(0);

                if (submission) {
                    const scores = await scoresRepo.find({ where: { submissionId: submission.id } });
                    if (scores.length > 0) {
                        roundScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
                        submission.finalScore = roundScore;
                        submission.isScored = true;
                        await submissionsRepo.save(submission);
                    } else {
                        submission.finalScore = 0;
                        submission.isScored = true;
                        await submissionsRepo.save(submission);
                    }
                }

                roundResults.push({
                    team,
                    roundScore,
                    submissionTimestamp
                });
            }

            // 2. Sort by Round Result (for Round Rank) + Handle Ties
            roundResults.sort((a, b) => {
                if (b.roundScore !== a.roundScore) return b.roundScore - a.roundScore;
                // Tie breaker: Earlier submission
                return a.submissionTimestamp.getTime() - b.submissionTimestamp.getTime();
            });

            // 3. Update Cumulative & Save Round Snapshot
            for (let i = 0; i < roundResults.length; i++) {
                const result = roundResults[i];
                const team = result.team;
                const roundRank = i + 1;

                // Calculate cumulative score: (round_score * weightage%) + previous_cumulative
                const previousEntry = await leaderboardRepo.findOne({
                    where: { teamId: team.id, roundId: IsNull() }, // IsNull() means cumulative snapshot
                });

                const weightedRoundScore = (result.roundScore * round.weightagePercentage) / 100;
                const newCumulative = (previousEntry?.cumulativeScore || 0) + weightedRoundScore;

                // Save Round Snapshot
                const roundSnapshot = leaderboardRepo.create({
                    hackathonId: round.hackathonId,
                    teamId: team.id,
                    roundId: round.id,
                    roundScore: result.roundScore,
                    cumulativeScore: newCumulative,
                    rank: roundRank
                });
                await leaderboardRepo.save(roundSnapshot);

                // Update/Create Cumulative Entry
                if (previousEntry) {
                    previousEntry.cumulativeScore = newCumulative;
                    previousEntry.previousRank = previousEntry.rank;
                    await leaderboardRepo.save(previousEntry);
                } else {
                    const newEntry = leaderboardRepo.create({
                        hackathonId: round.hackathonId,
                        teamId: team.id,
                        roundId: null,
                        roundScore: 0,
                        cumulativeScore: newCumulative,
                        rank: 0,
                    });
                    await leaderboardRepo.save(newEntry);
                }
            }

            // 4. Update overall ranks on cumulative entries
            const allCumulative = await leaderboardRepo.find({
                where: { hackathonId: round.hackathonId, roundId: IsNull() },
                relations: ['team']
            });

            // Sort cumulative entries
            allCumulative.sort((a, b) => {
                if (b.cumulativeScore !== a.cumulativeScore) return b.cumulativeScore - a.cumulativeScore;
                return 0; // Cumulative ties are fine, or add more logic
            });

            for (let i = 0; i < allCumulative.length; i++) {
                allCumulative[i].rank = i + 1;
                await leaderboardRepo.save(allCumulative[i]);

                // 5. Elimination Logic
                const team = await teamsRepo.findOne({ where: { id: allCumulative[i].teamId } });
                if (team && team.status === TeamStatus.APPROVED) {
                    const currentRoundScore = roundResults.find(r => r.team.id === team.id)?.roundScore || 0;

                    if (round.isElimination && round.eliminationThreshold !== null) {
                        if (currentRoundScore < round.eliminationThreshold) {
                            team.status = TeamStatus.ELIMINATED;
                        } else {
                            team.currentRound += 1;
                        }
                    } else {
                        team.currentRound += 1;
                    }
                    await teamsRepo.save(team);
                }
            }

            // 6. Close the round
            round.status = RoundStatus.CLOSED;
            round.isScoringFinalized = true;
            await manager.save(round);

            // 7. Check if this was the last round & Handle auto-completion
            const nextRound = round.hackathon.rounds.find(r => r.roundNumber === round.roundNumber + 1);

            const hackathon = await manager.findOne(Hackathon, { where: { id: round.hackathonId } });
            if (hackathon) {
                if (!nextRound) {
                    hackathon.status = HackathonStatus.COMPLETED;
                    // Mark winners
                    for (let i = 0; i < Math.min(allCumulative.length, 3); i++) {
                        const topTeam = await teamsRepo.findOne({ where: { id: allCumulative[i].teamId } });
                        if (topTeam && topTeam.status !== TeamStatus.ELIMINATED) {
                            if (i === 0) { topTeam.status = TeamStatus.WINNER; topTeam.finalPosition = 'Winner'; }
                            else if (i === 1) topTeam.finalPosition = 'Runner Up';
                            else if (i === 2) topTeam.finalPosition = 'Third Place';
                            await teamsRepo.save(topTeam);
                        }
                    }
                }
                await manager.save(hackathon);
            }
        });

        return { message: 'Round finalized. Leaderboard updated. Tactical survivors promoted.' };
    }

    async getSubmissionScores(submissionId: string) {
        return await this.scoresRepository.find({
            where: { submissionId },
            relations: ['mentor']
        });
    }

    async getTeamJudgingStatus(hackathonId: string, roundId: string) {
        const teams = await this.teamsRepository.find({
            where: { hackathonId, status: TeamStatus.APPROVED },
            relations: ['lead']
        });

        const statusList: any[] = [];

        for (const team of teams) {
            const submission = await this.submissionsRepository.findOne({
                where: { teamId: team.id, roundId, isFinal: true }
            });

            const scores = submission ? await this.scoresRepository.find({ where: { submissionId: submission.id } }) : [];

            statusList.push({
                teamId: team.id,
                teamName: team.name,
                hasSubmission: !!submission,
                submissionId: submission?.id,
                scoreCount: scores.length,
                isScored: submission?.isScored || false,
                finalScore: submission?.finalScore || null
            });
        }

        return statusList;
    }

    async getUploadUrl(filename: string, contentType: string) {
        const timestamp = Math.round(new Date().getTime() / 1000);
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

        // Sanitize filename and create a public_id
        const publicId = `hackathons/banners/${timestamp}-${filename.replace(/[^a-zA-Z0-9]/g, '_')}`;

        const signature = cloudinary.v2.utils.api_sign_request({
            timestamp: timestamp,
            public_id: publicId,
        }, process.env.CLOUDINARY_API_SECRET!);

        return {
            uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            publicUrl: `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`,
            signature,
            timestamp,
            apiKey: process.env.CLOUDINARY_API_KEY,
            cloudName,
            publicId
        };
    }

    async getLeaderboard(hackathonId: string, roundId?: string) {
        const where: any = { hackathonId };

        if (roundId) {
            where.roundId = roundId;
        } else {
            where.roundId = IsNull();
        }

        const entries = await this.leaderboardRepository.find({
            where,
            relations: ['team', 'team.lead'],
            order: { rank: 'ASC' }
        });

        // Enrich with round info if specific round
        let roundInfo: HackathonRound | null = null;
        if (roundId) {
            roundInfo = await this.roundsRepository.findOne({ where: { id: roundId } });
        }

        const hackathon = await this.hackathonsRepository.findOne({ where: { id: hackathonId } });
        if (!hackathon) throw new NotFoundException('Hackathon not found');

        return {
            hackathonId: hackathon.id,
            hackathonTitle: hackathon.title,
            hackathonStatus: hackathon.status,
            roundId: roundId || 'overall',
            roundTitle: roundInfo?.title || 'Overall Standings',
            entries: entries.map(e => ({
                rank: e.rank,
                previousRank: e.previousRank,
                teamName: e.team.name,
                teamId: e.team.id,
                leadName: e.team.lead?.name,
                roundScore: e.roundScore,
                cumulativeScore: e.cumulativeScore,
                status: e.team.status,
                finalPosition: e.team.finalPosition
            }))
        };
    }
}
