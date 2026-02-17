import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChaptersController } from './chapters.controller';
import { ChaptersService } from './chapters.service';
import { Chapter } from '../../entities/chapter.entity';
import { LessonBlock } from '../../entities/lesson-block.entity';
import { Module as ModuleEntity } from '../../entities/module.entity';
import { Course } from '../../entities/course.entity';
import { User } from '../../entities/user.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Chapter, LessonBlock, ModuleEntity, Course, User])
    ],
    controllers: [ChaptersController],
    providers: [ChaptersService],
})
export class ChaptersModule { }
