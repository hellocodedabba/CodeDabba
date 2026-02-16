import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Module } from './module.entity';
import { Submission } from './submission.entity';

@Entity()
export class Chapter {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column('text', { nullable: true })
    content: string; // Markdown content

    @Column()
    moduleId: string;

    @ManyToOne(() => Module, (module) => module.chapters, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'moduleId' })
    module: Module;

    @Column({ type: 'int', default: 0 })
    orderIndex: number;

    @OneToMany(() => Submission, (submission) => submission.chapter)
    submissions: Submission[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
