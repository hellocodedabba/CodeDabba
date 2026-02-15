import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Module } from './module.entity';
import { Submission } from './submission.entity';

@Entity()
export class Chapter {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @ManyToOne(() => Module, (module) => module.chapters)
    module: Module;

    @Column()
    moduleId: string;

    @Column({ nullable: true })
    videoUrl: string;

    @Column({ type: 'text', nullable: true })
    content: string; // Markdown notes

    @Column({ type: 'text', nullable: true })
    task: string; // Task description

    @OneToMany(() => Submission, (submission) => submission.chapter)
    submissions: Submission[];

    @Column()
    order: number;
}
