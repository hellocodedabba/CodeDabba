import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Course } from './course.entity';
import { Chapter } from './chapter.entity';

@Entity()
export class Module {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @ManyToOne(() => Course, (course) => course.modules)
    course: Course;

    @Column()
    courseId: string;

    @OneToMany(() => Chapter, (chapter) => chapter.module)
    chapters: Chapter[];

    @Column()
    order: number;
}
