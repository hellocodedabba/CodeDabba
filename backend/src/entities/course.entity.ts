import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Module } from './module.entity';
import { Enrollment } from './enrollment.entity';

@Entity()
export class Course {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column()
    description: string;

    @Column({ nullable: true })
    imageUrl: string;

    @ManyToOne(() => User, (user) => user.courses)
    mentor: User;

    @Column()
    mentorId: string;

    @Column({ default: false })
    published: boolean;

    @OneToMany(() => Module, (module) => module.course)
    modules: Module[];

    @OneToMany(() => Enrollment, (enrollment) => enrollment.course)
    enrollments: Enrollment[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
