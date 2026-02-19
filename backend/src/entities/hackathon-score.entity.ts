import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index, Unique } from 'typeorm';
import { Hackathon } from './hackathon.entity';
import { HackathonRound } from './hackathon-round.entity';
import { HackathonSubmission } from './hackathon-submission.entity';
import { HackathonTeam } from './hackathon-team.entity';
import { User } from './user.entity';

@Entity('hackathon_scores')
@Index(['roundId'])
@Index(['teamId'])
@Index(['mentorId'])
@Unique(['submissionId', 'mentorId'])
export class HackathonScore {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    hackathonId: string;

    @ManyToOne(() => Hackathon)
    @JoinColumn({ name: 'hackathonId' })
    hackathon: Hackathon;

    @Column()
    roundId: string;

    @ManyToOne(() => HackathonRound)
    @JoinColumn({ name: 'roundId' })
    round: HackathonRound;

    @Column()
    submissionId: string;

    @ManyToOne(() => HackathonSubmission)
    @JoinColumn({ name: 'submissionId' })
    submission: HackathonSubmission;

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

    @Column({ type: 'float' })
    score: number;

    @Column('text', { nullable: true })
    remarks: string;

    @CreateDateColumn()
    createdAt: Date;
}
