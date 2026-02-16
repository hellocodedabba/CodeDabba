import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum OtpType {
    REGISTRATION = 'REGISTRATION',
    MENTOR_APPLICATION = 'MENTOR_APPLICATION',
}

@Entity()
export class Otp {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    email: string;

    @Column()
    otp: string;

    @Column({
        type: 'varchar', // Explicitly use varchar for enum
        default: OtpType.REGISTRATION
    })
    type: OtpType;

    @Column()
    expiry: Date;

    @Column({ default: false })
    isUsed: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
