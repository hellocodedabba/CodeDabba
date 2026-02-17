import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index, DeleteDateColumn } from 'typeorm';
import { Course } from './course.entity';
import { Chapter } from './chapter.entity';

@Entity()
@Index(['courseId', 'orderIndex'], { unique: true })
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

    @DeleteDateColumn()
    deletedAt: Date;
}
