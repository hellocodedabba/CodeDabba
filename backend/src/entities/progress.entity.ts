import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, Unique, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { Course } from './course.entity';

@Entity()
@Unique(['userId', 'courseId'])
export class Progress {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @ManyToOne(() => User)
    user: User;

    @Column()
    courseId: string;

    @ManyToOne(() => Course)
    course: Course;

    @Column({ nullable: true })
    currentChapterId: string;

    @Column({ default: 0 })
    completedLessonsCount: number;

    @Column({ type: 'simple-array', nullable: true })
    completedChapterIds: string[];

    @Column({ default: 0 })
    totalPoints: number;

    @UpdateDateColumn()
    updatedAt: Date;
}
