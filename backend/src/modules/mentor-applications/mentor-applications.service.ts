import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MentorApplication, ApplicationStatus } from '../../entities/mentor-application.entity';
import { UsersService } from '../users/users.service';
import { Role } from '../../entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class MentorApplicationsService {
    constructor(
        @InjectRepository(MentorApplication)
        private mentorApplicationRepository: Repository<MentorApplication>,
        private usersService: UsersService,
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
        return this.mentorApplicationRepository.save(application);
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
            // If user exists, upgrade role to MENTOR? 
            // For simplicity, let's assume they shouldn't exist or we update them.
            // Let's update role if they are STUDENT
            if (user.role === Role.STUDENT) {
                await this.usersService.updateRole(user.id, Role.MENTOR);
            } else {
                // Already ADMIN or MENTOR, just approve app
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
        return this.mentorApplicationRepository.save(application);
    }

    async reject(id: string) {
        const application = await this.mentorApplicationRepository.findOne({ where: { id } });
        if (!application) throw new NotFoundException('Application not found');

        application.status = ApplicationStatus.REJECTED;
        return this.mentorApplicationRepository.save(application);
    }
}
