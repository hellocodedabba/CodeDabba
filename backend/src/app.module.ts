import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as dns from 'dns';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule'; // Import ScheduleModule
import { MailerModule } from '@nestjs-modules/mailer'; // Add import
import { File } from './entities/file.entity'; // Add import
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './auth/auth.module';
import { User } from './entities/user.entity';
import { StudentProfile } from './entities/student-profile.entity';
import { MentorProfile } from './entities/mentor-profile.entity';
import { Course } from './entities/course.entity';
import { Module as CourseModule } from './entities/module.entity'; // Rename to avoid conflict with @nestjs/common Module
import { Chapter } from './entities/chapter.entity';
import { Submission } from './entities/submission.entity';
import { Enrollment } from './entities/enrollment.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { MentorApplication } from './entities/mentor-application.entity';
import { Otp } from './entities/otp.entity';
import { CoursesModule } from './modules/courses/courses.module'; // Import Module, not controller
import { LessonBlock } from './entities/lesson-block.entity';
import { MentorApplicationsModule } from './modules/mentor-applications/mentor-applications.module';
import { OtpModule } from './modules/otp/otp.module';
import { ChaptersModule } from './modules/chapters/chapters.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { Task } from './entities/task.entity';
import { TaskOption } from './entities/task-option.entity';
import { TestCase } from './entities/test-case.entity';
import { Progress } from './entities/progress.entity';
import { Hackathon } from './entities/hackathon.entity';
import { HackathonRound } from './entities/hackathon-round.entity';
import { HackathonRegistration } from './entities/hackathon-registration.entity';
import { HackathonTeam } from './entities/hackathon-team.entity';
import { HackathonTeamInvitation } from './entities/hackathon-team-invitation.entity';
import { HackathonMentor } from './entities/hackathon-mentor.entity';
import { HackathonTeamMember } from './entities/hackathon-team-member.entity';
import { HackathonTeamMentorAssignment } from './entities/hackathon-team-mentor-assignment.entity';
import { HackathonSubmission } from './entities/hackathon-submission.entity';
import { HackathonScore } from './entities/hackathon-score.entity';
import { HackathonLeaderboard } from './entities/hackathon-leaderboard.entity';
import { HackathonsModule } from './modules/hackathons/hackathons.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(), // Enable ScheduleModule
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get('MAIL_HOST'), // e.g., smtp.gmail.com
          port: 587,
          secure: false, // true for 465, false for other ports
          auth: {
            user: configService.get('MAIL_USER'),
            pass: configService.get('MAIL_PASSWORD'),
          },
        },
        defaults: {
          from: `"CodeDabba" <${configService.get('MAIL_FROM')}>`,
        },
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const host = configService.get<string>('DB_HOST');
        if (!host) {
          throw new Error('DB_HOST environment variable is not defined');
        }
        const addresses = await dns.promises.resolve4(host);

        return {
          type: 'postgres',
          host: addresses[0],
          port: configService.get<number>('DB_PORT'),
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_DATABASE'),
          entities: [
            User, StudentProfile, MentorProfile, Course, CourseModule,
            Chapter, Submission, Enrollment, RefreshToken, MentorApplication,
            Otp, File, LessonBlock, Task, TaskOption, TestCase, Progress,
            Hackathon, HackathonRound, HackathonRegistration,
            HackathonTeam, HackathonTeamInvitation, HackathonMentor,
            HackathonTeamMember, HackathonTeamMentorAssignment, HackathonSubmission,
            HackathonScore, HackathonLeaderboard
          ],
          synchronize: true, // Auto-create tables (dev only)
          ssl: {
            rejectUnauthorized: false,
            servername: host, // Crucial for SNI with Neon
          },
        };
      },
    }),
    UsersModule,
    AuthModule,
    MentorApplicationsModule,
    OtpModule,
    CoursesModule,
    ChaptersModule,
    TasksModule,
    HackathonsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
