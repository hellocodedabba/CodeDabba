import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MentorApplicationsController } from './mentor-applications.controller';
import { MentorApplicationsService } from './mentor-applications.service';
import { MentorApplication } from '../../entities/mentor-application.entity';
import { MentorProfile } from '../../entities/mentor-profile.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MentorApplication, MentorProfile]),
    UsersModule,
  ],
  controllers: [MentorApplicationsController],
  providers: [MentorApplicationsService],
})
export class MentorApplicationsModule { }
