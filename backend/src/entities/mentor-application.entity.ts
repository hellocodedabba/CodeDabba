import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum ApplicationStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

@Entity()
export class MentorApplication {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    email: string;

    @Column()
    mobileNumber: string; // Changed from phoneNumber to match User entity style if needed, but keeping simple

    @Column()
    linkedinProfile: string;

    @Column({ nullable: true })
    portfolioUrl: string;

    @Column({ nullable: true })
    resumeFileId: string;

    @Column("text")
    expertise: string;

    @Column("text")
    bio: string;

    @Column({
        type: "text",
        default: ApplicationStatus.PENDING
    })
    status: ApplicationStatus;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
