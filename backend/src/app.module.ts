import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as dns from 'dns';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule'; // Import ScheduleModule
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(), // Enable ScheduleModule
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
          entities: [User, StudentProfile, MentorProfile, Course, CourseModule, Chapter, Submission, Enrollment, RefreshToken, MentorApplication, Otp, File, LessonBlock, Task, TaskOption, TestCase],
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
