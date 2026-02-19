import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Hackathon } from './hackathon.entity';

export enum RoundStatus {
    UPCOMING = 'upcoming',
    ACTIVE = 'active',
    JUDGING = 'judging',
    CLOSED = 'closed'
}

@Entity('hackathon_rounds')
export class HackathonRound {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    hackathonId: string;

    @ManyToOne(() => Hackathon, (hackathon) => hackathon.rounds, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'hackathonId' })
    hackathon: Hackathon;

    @Column()
    roundNumber: number;

    @Column()
    title: string;

    @Column('text', { nullable: true })
    description: string;

    @Column('timestamp')
    startDate: Date;

    @Column('timestamp')
    endDate: Date;

    @Column({
        type: 'enum',
        enum: RoundStatus,
        default: RoundStatus.UPCOMING
    })
    status: RoundStatus;

    @Column({ default: false })
    isScoringFinalized: boolean;

    @Column({ default: false })
    isElimination: boolean;

    @Column('decimal', { precision: 5, scale: 2, default: 0, nullable: true })
    eliminationThreshold: number;

    @Column('decimal', { precision: 5, scale: 2, default: 0 })
    weightagePercentage: number;

    @Column({ default: false })
    allowZip: boolean;

    @Column({ default: false })
    allowGithub: boolean;

    @Column({ default: false })
    allowVideo: boolean;

    @Column({ default: true })
    allowDescription: boolean;

    @Column({ default: 50 })
    maxFileSizeMb: number;

    @Column('simple-array', { nullable: true })
    allowedFileTypes: string[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
