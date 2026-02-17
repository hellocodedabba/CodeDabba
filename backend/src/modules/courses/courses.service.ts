import { Injectable, NotFoundException, UnauthorizedException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Course, CourseStatus, CourseVisibility, CourseAccessType } from '../../entities/course.entity';
import { Module as CourseModule } from '../../entities/module.entity';
import { Chapter } from '../../entities/chapter.entity';
import { User, Role } from '../../entities/user.entity';
import { MentorProfile } from '../../entities/mentor-profile.entity';
import { CreateCourseDto } from './dto/create-course.dto';

@Injectable()
export class CoursesService {
    constructor(
        @InjectRepository(Course)
        private coursesRepository: Repository<Course>,
        @InjectRepository(CourseModule)
        private modulesRepository: Repository<CourseModule>,
        @InjectRepository(Chapter)
        private chaptersRepository: Repository<Chapter>,
        @InjectRepository(MentorProfile)
        private mentorProfileRepository: Repository<MentorProfile>,
    ) { }

    async createCourse(user: User, createCourseDto: CreateCourseDto): Promise<Course> {
        // Double check role
        if (user.role !== Role.MENTOR) {
            throw new UnauthorizedException('Only mentors can create courses');
        }

        // Verify Mentor Profile
        const mentorProfile = await this.mentorProfileRepository.findOne({ where: { userId: user.id } });
        if (!mentorProfile) {
            throw new ForbiddenException('Mentor profile not found');
        }
        if (!mentorProfile.isVerified) {
            throw new ForbiddenException('Only verified mentors can create courses');
        }

        // Pricing Logic
        if (createCourseDto.accessType === CourseAccessType.FREE) {
            createCourseDto.price = 0;
        } else if (createCourseDto.accessType === CourseAccessType.PAID && createCourseDto.price <= 0) {
            throw new BadRequestException('Paid courses must have a price greater than 0');
        }

        // Slug Generation
        let slug = await this.generateSlug(createCourseDto.title);

        const course = this.coursesRepository.create({
            ...createCourseDto,
            slug,
            mentor: user,
            mentorId: user.id,
            status: CourseStatus.DRAFT,
            version: 1,
            visibility: CourseVisibility.PRIVATE,
        });

        return await this.coursesRepository.save(course);
    }

    private async generateSlug(title: string): Promise<string> {
        let slug = title.toLowerCase()
            .replace(/ /g, '-')
            .replace(/[^\w-]+/g, '');

        // Check uniqueness
        let uniqueSlug = slug;
        let counter = 1;
        while (await this.coursesRepository.findOne({ where: { slug: uniqueSlug } })) {
            uniqueSlug = `${slug}-${counter}`;
            counter++;
        }
        return uniqueSlug;
    }

    async findAll(query: any = {}): Promise<{ data: Course[], total: number, page: number, limit: number }> {
        const { page = 1, limit = 10, search, category, level } = query;
        const skip = (page - 1) * limit;

        const where: any = { status: CourseStatus.PUBLISHED, visibility: CourseVisibility.PUBLIC };

        if (search) {
            where.title = ILike(`%${search}%`);
        }
        if (category) {
            where.category = category;
        }
        if (level) {
            where.level = level;
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
