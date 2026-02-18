import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { HackathonTeam } from './hackathon-team.entity';
import { User } from './user.entity';

export enum TeamMemberRole {
    LEADER = 'leader',
    MEMBER = 'member'
}

@Entity('hackathon_team_members')
export class HackathonTeamMember {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    teamId: string;

    @ManyToOne(() => HackathonTeam, (team) => team.members)
    @JoinColumn({ name: 'teamId' })
    team: HackathonTeam;

    @Column()
    studentId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'studentId' })
    student: User;

    @Column({
        type: 'enum',
        enum: TeamMemberRole,
        default: TeamMemberRole.MEMBER
    })
    role: TeamMemberRole;

    @CreateDateColumn()
    createdAt: Date;
}
