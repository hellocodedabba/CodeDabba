import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class MentorProfile {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => User, (user) => user.mentorProfile)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    @Index()
    userId: string;

    @Column({ nullable: true })
    resume: string;

    @Column({ nullable: true })
    portfolio: string;

    @Column({ default: false })
    isVerified: boolean;
}
