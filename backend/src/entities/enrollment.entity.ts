import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Unique } from 'typeorm';
import { User } from './user.entity';
import { Course } from './course.entity';
import { EnrollmentStatus } from './student-profile.entity'; // Reuse enum

@Entity()
@Unique(['userId', 'courseId']) // Ensure one enrollment per user per course
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
