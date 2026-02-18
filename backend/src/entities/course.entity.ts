import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index, DeleteDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Module } from './module.entity';
import { File } from './file.entity';
import { Enrollment } from './enrollment.entity';

export enum CourseLevel {
    BEGINNER = 'beginner',
    INTERMEDIATE = 'intermediate',
    ADVANCED = 'advanced',
}

export enum CourseAccessType {
    FREE = 'free',
    PAID = 'paid',
}

export enum CourseStatus {
    DRAFT = 'draft',
    DRAFT_CURRICULUM = 'draft_curriculum',
    CURRICULUM_UNDER_REVIEW = 'curriculum_under_review',
    CURRICULUM_REJECTED = 'curriculum_rejected',
    CURRICULUM_APPROVED = 'curriculum_approved',
    CONTENT_DRAFT = 'content_draft',
    CONTENT_UNDER_REVIEW = 'content_under_review',
    CONTENT_REJECTED = 'content_rejected',
    PUBLISHED = 'published',
    REJECTED = 'rejected',
    ARCHIVED = 'archived',
}

export enum CourseVisibility {
    PRIVATE = 'private',
    PUBLIC = 'public',
    UNLISTED = 'unlisted',
}

@Entity()
export class Course {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ unique: true, nullable: true })
    @Index()
    slug: string;

    @Column('text')
    description: string;

    @Column({
        type: 'enum',
        enum: CourseLevel,
        default: CourseLevel.BEGINNER
    })
    level: CourseLevel;

    @Column("simple-array", { nullable: true })
    tags: string[];

    @Column({ default: 'General' })
    category: string;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    price: number;

    @Column({
        type: 'enum',
        enum: CourseAccessType,
        default: CourseAccessType.FREE
    })
    accessType: CourseAccessType;

    @Column({
        type: 'enum',
        enum: CourseStatus,
        default: CourseStatus.DRAFT_CURRICULUM
    })
    status: CourseStatus;

    @Column({
        type: 'enum',
        enum: CourseVisibility,
        default: CourseVisibility.PRIVATE
    })
    visibility: CourseVisibility;

    @Column({ default: 1 })
    version: number;

    @Column({ nullable: true })
    thumbnailUrl: string;

    @Column()
    mentorId: string;

    @ManyToOne(() => User, (user) => user.courses)
    @JoinColumn({ name: 'mentorId' })
    mentor: User;

    @Column({ type: 'timestamp', nullable: true })
    submittedCurriculumAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    curriculumReviewedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    submittedContentAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    contentReviewedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    publishedAt: Date;

    @Column({ nullable: true })
    publishedById: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'publishedById' })
    publishedBy: User;

    @Column({ type: 'text', nullable: true })
    rejectReason: string | null;

    @OneToMany(() => Module, (module) => module.course)
    modules: Module[];

    @OneToMany(() => Enrollment, (enrollment) => enrollment.course)
    enrollments: Enrollment[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}
