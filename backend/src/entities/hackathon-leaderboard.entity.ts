import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index, Unique } from 'typeorm';
import { Hackathon } from './hackathon.entity';
import { HackathonTeam } from './hackathon-team.entity';
import { HackathonRound } from './hackathon-round.entity';

@Entity('hackathon_leaderboard')
@Index(['hackathonId'])
@Index(['roundId'])
@Index(['teamId'])
@Unique(['hackathonId', 'teamId', 'roundId']) // One entry per team per round (roundId is null for overall)
export class HackathonLeaderboard {
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

    @Column({ nullable: true })
    roundId: string | null;

    @ManyToOne(() => HackathonRound)
    @JoinColumn({ name: 'roundId' })
    round: HackathonRound;

    @Column({ type: 'float', default: 0 })
    roundScore: number;

    @Column({ type: 'float', default: 0 })
    cumulativeScore: number;

    @Column({ type: 'int' })
    rank: number;

    @Column({ nullable: true })
    previousRank: number;

    @CreateDateColumn()
    createdAt: Date;
}
