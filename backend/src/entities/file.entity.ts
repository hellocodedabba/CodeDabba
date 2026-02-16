import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class File {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    filename: string;

    @Column()
    mimetype: string;

    @Column({
        type: 'bytea',
    })
    data: Buffer;

    @CreateDateColumn()
    createdAt: Date;
}
