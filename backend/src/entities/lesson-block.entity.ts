import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from 'typeorm';
import { Chapter } from './chapter.entity';

export enum BlockType {
    VIDEO = 'video',
    TEXT = 'text',
    IMAGE = 'image',
    FILE = 'file'
}

@Entity()
@Index(['chapterId', 'orderIndex'], { unique: true })
export class LessonBlock {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: BlockType,
    })
    type: BlockType;

    @Column('text')
    content: string;

    @Column({ type: 'int', default: 0 })
    orderIndex: number;

    @Column()
    chapterId: string;

    @ManyToOne(() => Chapter, (chapter) => chapter.blocks, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'chapterId' })
    chapter: Chapter;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}
