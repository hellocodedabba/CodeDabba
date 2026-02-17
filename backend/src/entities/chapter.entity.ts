import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, Index, DeleteDateColumn } from 'typeorm';
import { Module } from './module.entity';
import { Submission } from './submission.entity';
import { LessonBlock } from './lesson-block.entity';
import { Task } from './task.entity';

@Entity()
@Index(['moduleId', 'orderIndex'], { unique: true })
export class Chapter {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ default: 0 })
    points: number;

    @Column()
    moduleId: string;

    @ManyToOne(() => Module, (module) => module.chapters, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'moduleId' })
    module: Module;

    @Column({ type: 'int', default: 0 })
    orderIndex: number;

    @OneToMany(() => LessonBlock, (block) => block.chapter)
    blocks: LessonBlock[];

    @OneToMany(() => Submission, (submission) => submission.chapter)
    submissions: Submission[];

    @OneToMany(() => Task, (task) => task.chapter, { cascade: true })
    tasks: Task[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}
