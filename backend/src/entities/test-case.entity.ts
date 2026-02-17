import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Task } from './task.entity';

@Entity()
export class TestCase {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    taskId: string;

    @ManyToOne(() => Task, (task) => task.testCases, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'taskId' })
    task: Task;

    @Column('text')
    input: string; // The test input

    @Column('text')
    expectedOutput: string; // What we expect

    @Column({ default: false })
    isHidden: boolean; // Is this a hidden test case?
}
