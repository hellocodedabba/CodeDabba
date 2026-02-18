import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Hackathon } from './hackathon.entity';
import { HackathonTeam } from './hackathon-team.entity';
import { HackathonRound } from './hackathon-round.entity';

@Entity('hackathon_submissions')
@Index(['teamId', 'roundId'])
@Index(['roundId'])
export class HackathonSubmission {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    hackathonId: string;

    @ManyToOne(() => Hackathon)
    @JoinColumn({ name: 'hackathonId' })
    hackathon: Hackathon;

    @Column()
    teamId: string;

    @ManyToOne(() => HackathonTeam)
    @JoinColumn({ name: 'teamId' })
    team: HackathonTeam;

    @Column()
    roundId: string;

    @ManyToOne(() => HackathonRound)
    @JoinColumn({ name: 'roundId' })
    round: HackathonRound;

    @Column({ default: 1 })
    versionNumber: number;

    @Column({ nullable: true })
    zipUrl: string;

    @Column({ nullable: true })
    githubLink: string;

    @Column({ nullable: true })
    videoUrl: string;

    @Column('text', { nullable: true })
    description: string;

    @Column({ default: true })
    isFinal: boolean;

    @CreateDateColumn()
    submittedAt: Date;

    @Column({ nullable: true, type: 'float' })
    score: number;

    @Column({ nullable: true, type: 'text' })
    feedback: string;

    @Column({ nullable: true })
    evaluatedById: string;

    @Column({ nullable: true })
    evaluatedAt: Date;
}
