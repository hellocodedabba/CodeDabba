import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class MentorProfile {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => User, (user) => user.mentorProfile)
    @JoinColumn()
    user: User;

    @Column()
    userId: string;

    @Column({ nullable: true })
    resume: string;

    @Column({ nullable: true })
    portfolio: string;

    @Column({ default: false })
    isVerified: boolean;
}
