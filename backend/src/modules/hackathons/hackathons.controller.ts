import { Controller, Get, Post, Body, Param, UseGuards, Request, Query, Patch, Delete, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../entities/user.entity';
import { HackathonsService } from './hackathons.service';
import { CreateHackathonDto } from './dto/create-hackathon.dto';
import { RegisterHackathonDto, RegisterMemberDto } from './dto/register-hackathon.dto';
import { SubmitRoundDto } from './dto/submit-round.dto';
import { HackathonStatus } from '../../entities/hackathon.entity';
import { MentorAssignmentType } from '../../entities/hackathon-mentor.entity';
import { OptionalAuthGuard } from '../../common/guards/optional-auth.guard';

@Controller('hackathons')
export class HackathonsController {
    constructor(private readonly hackathonsService: HackathonsService) { }

    @Post()
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async create(@Request() req: any, @Body() createHackathonDto: CreateHackathonDto) {
        return await this.hackathonsService.create(req.user, createHackathonDto);
    }

    @Post('upload-banner')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async uploadBanner(@Body() body: { filename: string, contentType: string }) {
        return await this.hackathonsService.getUploadUrl(body.filename, body.contentType);
    }

    @Get()
    @UseGuards(OptionalAuthGuard)
    async findAll(@Request() req: any, @Query() query: any) {
        return await this.hackathonsService.findAll(query, req.user?.id);
    }

    @Get(':id')
    @UseGuards(OptionalAuthGuard)
    async findOne(@Request() req: any, @Param('id') id: string) {
        return await this.hackathonsService.findOne(id, req.user?.id);
    }

    @Get(':id/teams')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async getTeams(@Param('id') id: string) {
        return await this.hackathonsService.getHackathonTeams(id);
    }

    @Patch(':id/status')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async updateStatus(@Request() req: any, @Param('id') id: string, @Body('status') status: HackathonStatus) {
        return await this.hackathonsService.updateStatus(req.user, id, status);
    }

    @Post(':id/register')
    @UseGuards(AuthGuard)
    async register(@Request() req: any, @Param('id') id: string, @Body() registerDto: RegisterHackathonDto) {
        return await this.hackathonsService.register(req.user, id, registerDto);
    }

    @Get('mine/registrations')
    @UseGuards(AuthGuard)
    async getMyRegistrations(@Request() req: any) {
        return await this.hackathonsService.getMyRegistrations(req.user.id);
    }

    @Get('mine/invitations')
    @UseGuards(AuthGuard)
    async getInvitations(@Request() req: any) {
        return await this.hackathonsService.getInvitations(req.user.email);
    }

    @Patch('invitations/:id/accept')
    @UseGuards(AuthGuard)
    async acceptInvitation(@Request() req: any, @Param('id') id: string) {
        return await this.hackathonsService.acceptInvitation(req.user, id);
    }

    @Patch('invitations/:id/decline')
    @UseGuards(AuthGuard)
    async declineInvitation(@Request() req: any, @Param('id') id: string) {
        return await this.hackathonsService.declineInvitation(req.user, id);
    }

    @Get(':id/team')
    @UseGuards(AuthGuard)
    async getTeamDetails(@Request() req: any, @Param('id') id: string) {
        return await this.hackathonsService.getTeamDetails(req.user.id, id);
    }

    @Post(':id/team/invite')
    @UseGuards(AuthGuard)
    async inviteMember(@Request() req: any, @Param('id') id: string, @Body() memberDto: RegisterMemberDto) {
        return await this.hackathonsService.inviteMember(req.user, id, memberDto);
    }

    @Delete(':id/team/members/:registrationId')
    @UseGuards(AuthGuard)
    async removeMember(@Request() req: any, @Param('id') id: string, @Param('registrationId') registrationId: string) {
        return await this.hackathonsService.removeMember(req.user, id, registrationId);
    }

    @Delete(':id/team/invitations/:invitationId')
    @UseGuards(AuthGuard)
    async revokeInvitation(@Request() req: any, @Param('id') id: string, @Param('invitationId') invitationId: string) {
        return await this.hackathonsService.revokeInvitation(req.user, id, invitationId);
    }

    // Phase 2: Admin & Mentor Actions

    @Post(':id/finalize-teams')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async finalizeTeams(@Param('id') id: string) {
        return await this.hackathonsService.transitionToTeamsForming(id);
    }

    @Post(':id/mentors')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async assignMentors(
        @Param('id') id: string,
        @Body() body: { mentorIds: string[], type: MentorAssignmentType }
    ) {
        return await this.hackathonsService.assignMentors(id, body.mentorIds, body.type);
    }

    @Delete(':id/mentors/:mentorId')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async removeMentor(
        @Param('id') id: string,
        @Param('mentorId') mentorId: string
    ) {
        return await this.hackathonsService.removeMentor(id, mentorId);
    }

    @Get(':id/mentors/available')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async getAvailableMentors(@Param('id') id: string) {
        return await this.hackathonsService.getAvailableMentors(id);
    }

    @Get(':id/mentor/approval-list')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.MENTOR, Role.ADMIN)
    async getApprovalList(@Request() req: any, @Param('id') id: string) {
        return await this.hackathonsService.getTeamApprovalList(req.user, id);
    }

    @Get('mentor/hackathons')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.MENTOR)
    async getMentorHackathons(@Request() req: any) {
        return await this.hackathonsService.getMentorHackathons(req.user.id);
    }

    @Get('mentor/hackathons/:id/teams')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.MENTOR)
    async getMentorTeams(@Request() req: any, @Param('id') id: string) {
        return await this.hackathonsService.getMentorTeams(req.user.id, id);
    }

    @Post(':id/distribute-teams')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async distributeTeams(@Request() req: any, @Param('id') id: string) {
        return await this.hackathonsService.distributeTeamsToMentors(req.user, id);
    }

    @Post(':id/teams/:teamId/mentor/:mentorId')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async assignToTeam(
        @Param('id') id: string,
        @Param('teamId') teamId: string,
        @Param('mentorId') mentorId: string
    ) {
        return await this.hackathonsService.assignMentorToTeam(id, mentorId, teamId);
    }

    @Patch('teams/:teamId/approve')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.MENTOR, Role.ADMIN)
    async approveTeam(@Request() req: any, @Param('teamId') teamId: string) {
        return await this.hackathonsService.approveTeam(req.user, teamId);
    }

    @Patch('teams/:teamId/reject')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.MENTOR, Role.ADMIN)
    async rejectTeam(@Request() req: any, @Param('teamId') teamId: string, @Body('reason') reason: string) {
        return await this.hackathonsService.rejectTeam(req.user, teamId, reason);
    }

    // Phase 3: Round Transitions and Submissions

    @Get(':id/teams/:teamId/round-status')
    @UseGuards(AuthGuard)
    async getTeamRoundStatus(
        @Param('id') hackathonId: string,
        @Param('teamId') teamId: string
    ) {
        return await this.hackathonsService.getTeamRoundStatus(teamId, hackathonId);
    }

    @Post('teams/:teamId/rounds/:roundId/submit')
    @UseGuards(AuthGuard)
    @UseInterceptors(FileInterceptor('file'))
    async submitRound(
        @Request() req: any,
        @Param('teamId') teamId: string,
        @Param('roundId') roundId: string,
        @Body() dto: SubmitRoundDto,
        @UploadedFile() file: any
    ) {
        return await this.hackathonsService.submitRound(req.user, teamId, roundId, dto, file);
    }

    @Post('submissions/:id/evaluate')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.MENTOR, Role.ADMIN)
    async evaluateSubmission(
        @Request() req: any,
        @Param('id') id: string,
        @Body() body: { score: number, feedback: string }
    ) {
        return await this.hackathonsService.evaluateSubmission(req.user, id, body.score, body.feedback);
    }

    @Post('submissions/:id/score')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.MENTOR, Role.ADMIN)
    async submitScore(
        @Request() req: any,
        @Param('id') id: string,
        @Body() body: { score: number, remarks: string }
    ) {
        return await this.hackathonsService.submitScore(req.user, id, body.score, body.remarks);
    }

    @Post('rounds/:id/finalize-scoring')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async finalizeRound(@Request() req: any, @Param('id') id: string) {
        return await this.hackathonsService.finalizeRound(req.user, id);
    }

    @Get(':id/rounds/:roundId/judging-status')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.MENTOR)
    async getJudgingStatus(@Param('id') id: string, @Param('roundId') roundId: string) {
        return await this.hackathonsService.getTeamJudgingStatus(id, roundId);
    }

    @Get(':id/leaderboard')
    async getLeaderboard(@Param('id') id: string, @Query('roundId') roundId?: string) {
        return await this.hackathonsService.getLeaderboard(id, roundId);
    }
}
