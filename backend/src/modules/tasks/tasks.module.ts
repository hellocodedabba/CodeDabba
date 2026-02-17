import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from '../../entities/task.entity';
import { TaskOption } from '../../entities/task-option.entity';
import { TestCase } from '../../entities/test-case.entity';
import { Chapter } from '../../entities/chapter.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Task, TaskOption, TestCase, Chapter])],
    controllers: [TasksController],
    providers: [TasksService],
})
export class TasksModule { }
