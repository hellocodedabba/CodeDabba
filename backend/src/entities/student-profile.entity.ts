import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';

export enum EnrollmentStatus {
    PENDING = 'PENDING',
    ACTIVE = 'ACTIVE',
    REJECTED = 'REJECTED',
}

@Entity()
export class StudentProfile {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => User, (user) => user.studentProfile)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    @Index()
    userId: string;

    @Column({ nullable: true })
    paymentProofUrl: string;

    @Column({
        type: 'text',
        default: EnrollmentStatus.PENDING
    })
    enrollmentStatus: EnrollmentStatus;
}
