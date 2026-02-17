import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MentorApplication, ApplicationStatus } from '../../entities/mentor-application.entity';
import { UsersService } from '../users/users.service';
import { Role } from '../../entities/user.entity';
import { MailerService } from '@nestjs-modules/mailer';
import * as bcrypt from 'bcrypt';

@Injectable()
export class MentorApplicationsService {
    constructor(
        @InjectRepository(MentorApplication)
        private mentorApplicationRepository: Repository<MentorApplication>,
        private usersService: UsersService,
        private readonly mailerService: MailerService,
    ) { }

    async create(createDto: Partial<MentorApplication>) {
        // Simple check if email already applied
        const existing = await this.mentorApplicationRepository.findOne({ where: { email: createDto.email } });
        if (existing && existing.status === ApplicationStatus.PENDING) {
            throw new BadRequestException('Application already pending for this email.');
        }

        const application = this.mentorApplicationRepository.create({
            ...createDto,
            status: ApplicationStatus.PENDING,
        });
        const savedApplication = await this.mentorApplicationRepository.save(application);

        // Send confirmation email to mentor
        await this.sendEmail(
            savedApplication.email,
            'CodeDabba Mentor Application Received',
            `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Application Received</h2>
                    <p>Dear ${savedApplication.name},</p>
                    <p>Thank you for applying to be a mentor at CodeDabba. We have received your application with the following details:</p>
                    <ul>
                        <li><strong>Name:</strong> ${savedApplication.name}</li>
                        <li><strong>Email:</strong> ${savedApplication.email}</li>
                        <li><strong>Mobile Number:</strong> ${savedApplication.mobileNumber}</li>
                        <li><strong>Expertise:</strong> ${savedApplication.expertise}</li>
                        <li><strong>Bio:</strong> ${savedApplication.bio}</li>
                        <li><strong>LinkedIn:</strong> ${savedApplication.linkedinProfile}</li>
                        ${savedApplication.portfolioUrl ? `<li><strong>Portfolio URL:</strong> ${savedApplication.portfolioUrl}</li>` : ''}
                    </ul>
                    <p>Our team will review your application and get back to you shortly.</p>
                </div>
            `
        );

        return savedApplication;
    }

    async findAll() {
        return this.mentorApplicationRepository.find({
            order: { createdAt: 'DESC' }
        });
    }

    async approve(id: string) {
        const application = await this.mentorApplicationRepository.findOne({ where: { id } });
        if (!application) throw new NotFoundException('Application not found');

        if (application.status !== ApplicationStatus.PENDING) {
            throw new BadRequestException('Application is not pending');
        }

        // Create User
        // Generate a temporary password (or fixed one for simplicity in this demo context)
        const tempPassword = 'Mentor@128#';

        // Check if user exists (maybe they were a student?)
        let user = await this.usersService.findByEmail(application.email);

        if (user) {
            // If user exists, upgrade role to MENTOR
            if (user.role === Role.STUDENT) {
                await this.usersService.updateRole(user.id, Role.MENTOR);
            }
        } else {
            // Create new user
            await this.usersService.createUser({
                email: application.email,
                password: tempPassword,
                role: Role.MENTOR,
                name: application.name,
                mobileNumber: application.mobileNumber,
                location: 'Remote', // Default
            });
        }

        application.status = ApplicationStatus.APPROVED;
        const savedApplication = await this.mentorApplicationRepository.save(application);

        // Send approval email to mentor
        await this.sendEmail(
            savedApplication.email,
            'Congratulations! You are now a CodeDabba Mentor',
            `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Application Approved!</h2>
                    <p>Dear ${savedApplication.name},</p>
                    <p>We are thrilled to inform you that your application to become a mentor at CodeDabba has been approved!</p>
                    <p>You can now log in to your dashboard using your credentials.</p>
                    ${!user ? `<p><strong>Temporary Password:</strong> ${tempPassword}</p>` : ''}
                    <p>Please log in and update your profile.</p>
                    <a href="http://localhost:3000/login" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login to Dashboard</a>
                </div>
            `
        );

        return savedApplication;
    }

    async reject(id: string) {
        const application = await this.mentorApplicationRepository.findOne({ where: { id } });
        if (!application) throw new NotFoundException('Application not found');

        application.status = ApplicationStatus.REJECTED;
        return this.mentorApplicationRepository.save(application);
    }

    // Helper method for sending emails
    async sendEmail(to: string, subject: string, html: string) {
        console.log(`[DEV ONLY] Sending email to ${to} with subject: ${subject}`);
        try {
            await this.mailerService.sendMail({
                to,
                subject,
                html,
            });
        } catch (error) {
            console.error('Error sending email:', error);
            // Don't throw in dev mode to allow flow to continue
            // In prod, you might want to retry or alert admin
        }
    }
}
