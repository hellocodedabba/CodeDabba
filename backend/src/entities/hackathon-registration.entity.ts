import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';
import { Hackathon } from './hackathon.entity';
import { HackathonTeam } from './hackathon-team.entity';
import { User } from './user.entity';

export enum RegistrationType {
    INDIVIDUAL = 'individual',
    TEAM = 'team'
}

@Entity('hackathon_registrations')
@Unique(['hackathonId', 'studentId'])
@Unique(['hackathonId', 'invitedEmail'])
export class HackathonRegistration {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    hackathonId: string;

    @ManyToOne(() => Hackathon, (hackathon) => hackathon.registrations, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'hackathonId' })
    hackathon: Hackathon;

    @Column({ nullable: true })
    studentId: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'studentId' })
    student: User;

    @Column({ nullable: true })
    invitedEmail: string;

    @Column({
        type: 'enum',
        enum: RegistrationType,
        default: RegistrationType.INDIVIDUAL
    })
    registrationType: RegistrationType;

    @Column({ nullable: true })
    teamId: string;

    @ManyToOne(() => HackathonTeam, { nullable: true })
    team: HackathonTeam;

    @Column({ default: false })
    isTeamLead: boolean;

    @Column({ default: 'registered' })
    status: string;

    @Column({ nullable: true })
    name: string;

    @Column({ nullable: true })
    mobile: string;

    @Column({ nullable: true })
    collegeEmail: string;

    @Column({ nullable: true })
    highestQualification: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
