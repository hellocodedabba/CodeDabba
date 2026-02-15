import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as dns from 'dns';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import { CoursesController } from './modules/courses/courses.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
          entities: [User, StudentProfile, MentorProfile, Course, CourseModule, Chapter, Submission, Enrollment],
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
  ],
  controllers: [AppController, CoursesController],
  providers: [AppService],
})
export class AppModule { }
