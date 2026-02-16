import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Course } from '../../entities/course.entity';
import { Module as CourseModule } from '../../entities/module.entity';
import { Chapter } from '../../entities/chapter.entity';
import { User, Role } from '../../entities/user.entity';

@Injectable()
export class CoursesService {
    constructor(
        @InjectRepository(Course)
        private coursesRepository: Repository<Course>,
        @InjectRepository(CourseModule)
        private modulesRepository: Repository<CourseModule>,
        @InjectRepository(Chapter)
        private chaptersRepository: Repository<Chapter>,
    ) { }

    async createCourse(mentor: User, data: Partial<Course>): Promise<Course> {
        if (mentor.role !== Role.MENTOR && mentor.role !== Role.ADMIN) {
            throw new UnauthorizedException('Only mentors can create courses');
        }
        const course = this.coursesRepository.create({
            ...data,
            mentor,
            mentorId: mentor.id,
        });
        return await this.coursesRepository.save(course);
    }

    async findAll(query: any = {}): Promise<{ data: Course[], total: number, page: number, limit: number }> {
        const { page = 1, limit = 10, search, category, difficulty } = query;
        const skip = (page - 1) * limit;

        const where: any = { isPublished: true };

        if (search) {
            where.title = ILike(`%${search}%`);
        }
        if (category) {
            where.category = category;
        }
        if (difficulty) {
            where.difficulty = difficulty;
        }

        const [data, total] = await this.coursesRepository.findAndCount({
            where,
            relations: ['mentor', 'thumbnail'],
            order: { createdAt: 'DESC' },
            skip,
            take: limit,
        });

        return { data, total, page: +page, limit: +limit };
    }

    async findOne(id: string): Promise<Course> {
        const course = await this.coursesRepository.findOne({
            where: { id },
            relations: ['mentor', 'thumbnail', 'modules', 'modules.chapters'],
            order: {
                modules: {
                    orderIndex: 'ASC',
                    chapters: {
                        orderIndex: 'ASC',
                    }
                }
            }
        });
        if (!course) throw new NotFoundException('Course not found');
        return course;
    }

    async findMyCourses(mentorId: string): Promise<Course[]> {
        return await this.coursesRepository.find({
            where: { mentorId },
            relations: ['thumbnail'],
            order: { createdAt: 'DESC' },
        });
    }

    async createModule(courseId: string, title: string, orderIndex: number): Promise<CourseModule> {
        const module = this.modulesRepository.create({
            title,
            courseId,
            orderIndex,
        });
        return await this.modulesRepository.save(module);
    }

    async createChapter(moduleId: string, title: string, content: string, orderIndex: number): Promise<Chapter> {
        const chapter = this.chaptersRepository.create({
            title,
            content,
            moduleId,
            orderIndex,
        });
        return await this.chaptersRepository.save(chapter);
    }
}
