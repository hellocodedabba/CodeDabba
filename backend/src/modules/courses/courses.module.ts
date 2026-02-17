import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { Course } from '../../entities/course.entity';
import { Module as CourseModule } from '../../entities/module.entity';
import { Chapter } from '../../entities/chapter.entity';
import { MentorProfile } from '../../entities/mentor-profile.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Course, CourseModule, Chapter, MentorProfile])],
    providers: [CoursesService],
    controllers: [CoursesController],
    exports: [CoursesService],
})
export class CoursesModule { }
