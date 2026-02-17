import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Chapter } from './chapter.entity';
import { TaskOption } from './task-option.entity';
import { TestCase } from './test-case.entity';

export enum TaskType {
    MCQ = 'MCQ',
    CODING = 'CODING',
}

@Entity()
export class Task {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    chapterId: string;

    @ManyToOne(() => Chapter, (chapter) => chapter.tasks, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'chapterId' })
    chapter: Chapter;

    @Column()
    title: string;

    @Column({
        type: 'enum',
        enum: TaskType,
    })
    type: TaskType;

    @Column('text')
    problemStatement: string; // Markdown supported

    @Column({ default: 10 })
    points: number;

    @Column({ default: false })
    isRequired: boolean;

    @Column({ default: 0 })
    orderIndex: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // --- Coding Specific Fields ---

    @Column({ default: 'python' }) // initially single language
    language: string;

    @Column('text', { nullable: true })
    starterCode: string;

    @Column({ default: 2 }) // in seconds
    timeLimit: number;

    @Column({ default: 256 }) // in MB
    memoryLimit: number;

    // --- Relations ---

    @OneToMany(() => TaskOption, (option) => option.task, { cascade: true })
    options: TaskOption[];

    @OneToMany(() => TestCase, (testCase) => testCase.task, { cascade: true })
    testCases: TestCase[];
}
