import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, Unique, Index } from 'typeorm';
import { Hackathon } from './hackathon.entity';
import { User } from './user.entity';

export enum InvitationStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    DECLINED = 'declined',
    EXPIRED = 'expired'
}

@Entity('hackathon_team_invitations')
@Unique(['hackathonId', 'invitedEmail'])
export class HackathonTeamInvitation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    hackathonId: string;

    @ManyToOne(() => Hackathon)
    hackathon: Hackathon;

    @Column()
    teamName: string;

    @Column()
    invitedEmail: string;

    @Column({ nullable: true })
    invitedName: string;

    @Column({ nullable: true })
    invitedMobile: string;

    @Column({ nullable: true })
    invitedTrack: string; // Combined education info

    @Column()
    invitedById: string;

    @ManyToOne(() => User)
    invitedBy: User;

    @Column({
        type: 'enum',
        enum: InvitationStatus,
        default: InvitationStatus.PENDING
    })
    status: InvitationStatus;

    @Column({ unique: true })
    @Index()
    token: string;

    @Column()
    expiresAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @Column({ nullable: true })
    acceptedAt: Date;
}
