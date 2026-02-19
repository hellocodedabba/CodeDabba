import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { HackathonRound } from './hackathon-round.entity';
import { HackathonRegistration } from './hackathon-registration.entity';
import { HackathonMentor } from './hackathon-mentor.entity';

export enum HackathonStatus {
    DRAFT = 'draft',
    REGISTRATION_OPEN = 'registration_open',
    REGISTRATION_CLOSED = 'registration_closed',
    TEAMS_FORMING = 'teams_forming',
    APPROVAL_IN_PROGRESS = 'approval_in_progress',
    READY_FOR_ROUND_1 = 'ready_for_round_1',
    ROUND_ACTIVE = 'round_active',
    JUDGING = 'judging',
    COMPLETED = 'completed'
}

@Entity('hackathons')
export class Hackathon {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column('text')
    description: string;

    @Column({ nullable: true })
    bannerUrl: string;

    @Column('text', { nullable: true })
    rules: string;

    @Column('text', { nullable: true })
    evaluationCriteria: string;

    @Column('timestamp')
    registrationStart: Date;

    @Column('timestamp')
    registrationEnd: Date;

    @Column('timestamp')
    startDate: Date;

    @Column('timestamp')
    endDate: Date;

    @Column({
        type: 'enum',
        enum: HackathonStatus,
        default: HackathonStatus.DRAFT
    })
    status: HackathonStatus;

    @Column({ default: 1 })
    maxTeamSize: number;

    @Column({ nullable: true })
    maxParticipants: number;

    @Column({ default: true })
    allowIndividual: boolean;

    @Column({ default: true })
    allowTeam: boolean;

    @Column({ default: false })
    isMentorDistributed: boolean;

    @Column()
    createdById: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'createdById' })
    createdBy: User;

    @OneToMany(() => HackathonRound, (round) => round.hackathon, { cascade: true })
    rounds: HackathonRound[];

    @OneToMany(() => HackathonRegistration, (reg) => reg.hackathon)
    registrations: HackathonRegistration[];

    @OneToMany(() => HackathonMentor, (mentor) => mentor.hackathon)
    mentors: HackathonMentor[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
