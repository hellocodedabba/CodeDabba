import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Module } from './module.entity';
import { File } from './file.entity';
import { Enrollment } from './enrollment.entity';

@Entity()
export class Course {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column('text')
    description: string;

    @Column({ nullable: true })
    thumbnailId: string;

    @ManyToOne(() => File)
    @JoinColumn({ name: 'thumbnailId' })
    thumbnail: File;

    @Column()
    mentorId: string;

    @ManyToOne(() => User, (user) => user.courses)
    @JoinColumn({ name: 'mentorId' })
    mentor: User;

    @Column({ default: 'Beginner' })
    difficulty: string;

    @Column({ default: 'General' })
    category: string;

    @Column({ default: false })
    isPublished: boolean;

    @OneToMany(() => Module, (module) => module.course)
    modules: Module[];

    @OneToMany(() => Enrollment, (enrollment) => enrollment.course)
    enrollments: Enrollment[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
