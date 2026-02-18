import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Hackathon } from './hackathon.entity';
import { User } from './user.entity';

export enum MentorAssignmentType {
    GLOBAL = 'global',
    SPECIFIC = 'specific'
}

@Entity('hackathon_mentors')
export class HackathonMentor {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    hackathonId: string;

    @ManyToOne(() => Hackathon, (hackathon) => hackathon.mentors)
    @JoinColumn({ name: 'hackathonId' })
    hackathon: Hackathon;

    @Column()
    mentorId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'mentorId' })
    mentor: User;

    @Column({
        type: 'enum',
        enum: MentorAssignmentType,
        default: MentorAssignmentType.GLOBAL
    })
    assignmentType: MentorAssignmentType;
}
