import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Chapter } from './chapter.entity';

export enum SubmissionStatus {
    PENDING = 'PENDING',
    PASSED = 'PASSED',
    FAILED = 'FAILED',
}

@Entity()
export class Submission {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, (user) => user.submissions)
    user: User;

    @Column()
    userId: string;

    @ManyToOne(() => Chapter, (chapter) => chapter.submissions)
    chapter: Chapter;

    @Column()
    chapterId: string;

    @Column({ type: 'text' })
    code: string;

    @Column({
        type: 'text',
        default: SubmissionStatus.PENDING
    })
    status: SubmissionStatus;

    @CreateDateColumn()
    createdAt: Date;
}
