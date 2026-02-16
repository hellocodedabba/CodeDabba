import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, OneToMany } from 'typeorm';
import { StudentProfile } from './student-profile.entity';
import { MentorProfile } from './mentor-profile.entity';
import { Course } from './course.entity';
import { Enrollment } from './enrollment.entity';
import { Submission } from './submission.entity';
import { RefreshToken } from './refresh-token.entity';

export enum Role {
    STUDENT = 'STUDENT',
    MENTOR = 'MENTOR',
    ADMIN = 'ADMIN',
}

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column({ nullable: true })
    password: string;

    @Column({
        type: 'text',
        default: Role.STUDENT
    })
    role: Role;

    @Column({ nullable: true })
    name: string;

    @Column({ nullable: true })
    mobileNumber: string;

    @Column({ nullable: true })
    location: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToOne(() => StudentProfile, (profile) => profile.user)
    studentProfile: StudentProfile;

    @OneToOne(() => MentorProfile, (profile) => profile.user)
    mentorProfile: MentorProfile;

    @OneToMany(() => Course, (course) => course.mentor)
    courses: Course[];

    @OneToMany(() => Enrollment, (enrollment) => enrollment.user)
    enrollments: Enrollment[];

    @OneToMany(() => Submission, (submission) => submission.user)
    submissions: Submission[];

    @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
    refreshTokens: RefreshToken[];
}
