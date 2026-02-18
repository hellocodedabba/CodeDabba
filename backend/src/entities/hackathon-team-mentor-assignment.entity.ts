import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { HackathonTeam } from './hackathon-team.entity';
import { User } from './user.entity';

@Entity('hackathon_team_mentor_assignments')
export class HackathonTeamMentorAssignment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    teamId: string;

    @ManyToOne(() => HackathonTeam)
    @JoinColumn({ name: 'teamId' })
    team: HackathonTeam;

    @Column()
    mentorId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'mentorId' })
    mentor: User;
}
