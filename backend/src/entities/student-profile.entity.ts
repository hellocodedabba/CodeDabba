import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
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
    @JoinColumn()
    user: User;

    @Column()
    userId: string; // TypeORM maps userId from relation, but good to have explicit column sometimes for query builder

    @Column({ nullable: true })
    paymentProofUrl: string;

    @Column({
        type: 'text',
        default: EnrollmentStatus.PENDING
    })
    enrollmentStatus: EnrollmentStatus;
}
