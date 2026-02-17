import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Task, TaskType } from '../../entities/task.entity';
import { TaskOption } from '../../entities/task-option.entity';
import { TestCase } from '../../entities/test-case.entity';
import { Chapter } from '../../entities/chapter.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ReorderTaskItemDto } from './dto/reorder-task.dto';
import { CourseStatus } from '../../entities/course.entity';

@Injectable()
export class TasksService {
    constructor(
        @InjectRepository(Task)
        private taskRepository: Repository<Task>,
        @InjectRepository(TaskOption)
        private taskOptionRepository: Repository<TaskOption>,
        @InjectRepository(TestCase)
        private testCaseRepository: Repository<TestCase>,
        @InjectRepository(Chapter)
        private chapterRepository: Repository<Chapter>,
        private dataSource: DataSource,
    ) { }

    async create(chapterId: string, createTaskDto: CreateTaskDto, userId: string): Promise<Task> {
        const chapter = await this.chapterRepository.findOne({
            where: { id: chapterId },
            relations: ['module', 'module.course'],
        });

        if (!chapter) throw new NotFoundException('Chapter not found');

        const course = chapter.module.course;
        if (course.mentorId !== userId) throw new ForbiddenException('Not authorized');
        if (course.status !== CourseStatus.DRAFT && course.status !== CourseStatus.REJECTED) {
            throw new BadRequestException('Course must be in DRAFT or REJECTED mode to add tasks');
        }

        const lastTask = await this.taskRepository.findOne({
            where: { chapterId },
            order: { orderIndex: 'DESC' },
        });

        const newOrderIndex = (lastTask?.orderIndex || 0) + 1;

        const task = this.taskRepository.create({
            ...createTaskDto,
            chapterId,
            orderIndex: newOrderIndex,
        });

        return this.taskRepository.save(task);
    }

    async findAll(chapterId: string): Promise<Task[]> {
        return this.taskRepository.find({
            where: { chapterId },
            relations: ['options', 'testCases'],
            order: { orderIndex: 'ASC' },
        });
    }

    async update(id: string, updateTaskDto: UpdateTaskDto, userId: string): Promise<Task> {
        const task = await this.taskRepository.findOne({
            where: { id },
            relations: ['chapter', 'chapter.module', 'chapter.module.course', 'options', 'testCases'],
        });

        if (!task) throw new NotFoundException('Task not found');
        if (task.chapter.module.course.mentorId !== userId) throw new ForbiddenException('Not authorized');

        const course = task.chapter.module.course;
        if (course.status !== CourseStatus.DRAFT && course.status !== CourseStatus.REJECTED) {
            throw new BadRequestException('Course must be in DRAFT or REJECTED mode to edit tasks');
        }

        // Handle nested updates manually if needed, or rely on cascade save if structured correctly.
        // For simplicity, we'll update the main task fields and recreate options/testCases if provided.

        const { options, testCases, ...taskData } = updateTaskDto;

        Object.assign(task, taskData);

        if (options && task.type === TaskType.MCQ) {
            // Replace existing options
            await this.taskOptionRepository.delete({ taskId: id });
            const newOptions = options.map(opt => this.taskOptionRepository.create({ ...opt, taskId: id }));
            task.options = newOptions;
        }

        if (testCases && task.type === TaskType.CODING) {
            // Replace existing test cases
            await this.testCaseRepository.delete({ taskId: id });
            const newTestCases = testCases.map(tc => this.testCaseRepository.create({ ...tc, taskId: id }));
            task.testCases = newTestCases;
        }

        return this.taskRepository.save(task);
    }

    async remove(id: string, userId: string): Promise<void> {
        const task = await this.taskRepository.findOne({
            where: { id },
            relations: ['chapter', 'chapter.module', 'chapter.module.course'],
        });

        if (!task) throw new NotFoundException('Task not found');
        if (task.chapter.module.course.mentorId !== userId) throw new ForbiddenException('Not authorized');

        const course = task.chapter.module.course;
        if (course.status !== CourseStatus.DRAFT && course.status !== CourseStatus.REJECTED) {
            throw new BadRequestException('Course must be in DRAFT or REJECTED mode to remove tasks');
        }

        await this.taskRepository.delete(id);
    }

    async reorder(chapterId: string, items: ReorderTaskItemDto[], userId: string): Promise<void> {
        const chapter = await this.chapterRepository.findOne({
            where: { id: chapterId },
            relations: ['module', 'module.course'],
        });

        if (!chapter) throw new NotFoundException('Chapter not found');
        if (chapter.module.course.mentorId !== userId) throw new ForbiddenException('Not authorized');

        const course = chapter.module.course;
        if (course.status !== CourseStatus.DRAFT && course.status !== CourseStatus.REJECTED) {
            throw new BadRequestException('Course must be in DRAFT or REJECTED mode to reorder tasks');
        }

        await this.dataSource.transaction(async (manager) => {
            for (const item of items) {
                await manager.update(Task, { id: item.id, chapterId }, { orderIndex: item.order_index });
            }
        });
    }
}
