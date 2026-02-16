import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Course } from './course.entity';
import { Chapter } from './chapter.entity';

@Entity()
export class Module {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column()
    courseId: string;

    @ManyToOne(() => Course, (course) => course.modules, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'courseId' })
    course: Course;

    @Column({ type: 'int', default: 0 })
    orderIndex: number;

    @OneToMany(() => Chapter, (chapter) => chapter.module)
    chapters: Chapter[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
