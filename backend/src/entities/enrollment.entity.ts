import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Course } from './course.entity';
import { EnrollmentStatus } from './student-profile.entity'; // Reuse enum

@Entity()
export class Enrollment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, (user) => user.enrollments)
    user: User;

    @Column()
    userId: string;

    @ManyToOne(() => Course, (course) => course.enrollments)
    course: Course;

    @Column()
    courseId: string;

    @Column({
        type: 'text',
        default: EnrollmentStatus.PENDING
    })
    status: EnrollmentStatus;

    @CreateDateColumn()
    createdAt: Date;
}
