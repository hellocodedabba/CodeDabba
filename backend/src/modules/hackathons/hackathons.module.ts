import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hackathon } from '../../entities/hackathon.entity';
import { HackathonRound } from '../../entities/hackathon-round.entity';
import { HackathonRegistration } from '../../entities/hackathon-registration.entity';
import { HackathonTeam } from '../../entities/hackathon-team.entity';
import { HackathonTeamInvitation } from '../../entities/hackathon-team-invitation.entity';
import { HackathonMentor } from '../../entities/hackathon-mentor.entity';
import { HackathonTeamMentorAssignment } from '../../entities/hackathon-team-mentor-assignment.entity';
import { HackathonTeamMember } from '../../entities/hackathon-team-member.entity';
import { HackathonSubmission } from '../../entities/hackathon-submission.entity';
import { HackathonScore } from '../../entities/hackathon-score.entity';
import { HackathonLeaderboard } from '../../entities/hackathon-leaderboard.entity';
import { User } from '../../entities/user.entity';
import { HackathonsService } from './hackathons.service';
import { HackathonsController } from './hackathons.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Hackathon,
            HackathonRound,
            HackathonRegistration,
            HackathonTeam,
            HackathonTeamInvitation,
            HackathonMentor,
            HackathonTeamMentorAssignment,
            HackathonTeamMember,
            HackathonSubmission,
            HackathonScore,
            HackathonLeaderboard,
            User
        ])
    ],
    controllers: [HackathonsController],
    providers: [HackathonsService],
    exports: [HackathonsService]
})
export class HackathonsModule { }
