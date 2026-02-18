import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Hackathon } from './hackathon.entity';
import { User } from './user.entity';
import { HackathonTeamMember } from './hackathon-team-member.entity';

export enum TeamStatus {
    FORMING = 'forming',
    PENDING_APPROVAL = 'pending_approval',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    ELIMINATED = 'eliminated',
    WINNER = 'winner'
}

@Entity('hackathon_teams')
export class HackathonTeam {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    hackathonId: string;

    @ManyToOne(() => Hackathon)
    hackathon: Hackathon;

    @Column()
    name: string;

    @Column()
    leadId: string;

    @ManyToOne(() => User)
    lead: User;

    @Column({
        type: 'enum',
        enum: TeamStatus,
        default: TeamStatus.FORMING
    })
    status: TeamStatus;

    @Column({ default: false })
    isLocked: boolean;

    @Column({ default: 1 })
    currentRound: number;

    @Column({ nullable: true })
    approvedAt: Date;

    @Column({ nullable: true })
    approvedById: string;

    @ManyToOne(() => User, { nullable: true })
    approvedBy: User;

    @Column({ type: 'text', nullable: true })
    rejectReason: string;

    @OneToMany(() => HackathonTeamMember, (member) => member.team)
    members: HackathonTeamMember[];

    @CreateDateColumn()
    createdAt: Date;
}
