import { Injectable, NotFoundException, UnauthorizedException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Course, CourseStatus, CourseVisibility, CourseAccessType } from '../../entities/course.entity';
import { Module as CourseModule } from '../../entities/module.entity';
import { Chapter } from '../../entities/chapter.entity';
import { User, Role } from '../../entities/user.entity';
import { MentorProfile } from '../../entities/mentor-profile.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { ReorderItemDto } from './dto/reorder.dto';
import * as cloudinary from 'cloudinary';
import { LessonBlock } from '../../entities/lesson-block.entity';
import { CreateBlockDto } from './dto/create-block.dto';

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
        @InjectRepository(LessonBlock)
        private blocksRepository: Repository<LessonBlock>,
    ) {
        cloudinary.v2.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
    }

    async createCourse(user: User, createCourseDto: CreateCourseDto): Promise<Course> {
        // Double check role
        if (user.role !== Role.MENTOR) {
            throw new ForbiddenException('Only mentors can create courses');
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
            mentorId: user.id,
            status: CourseStatus.DRAFT,
            version: 1,
            visibility: CourseVisibility.PRIVATE,
        });

        return await this.coursesRepository.save(course);
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
            relations: ['mentor'],
            order: { createdAt: 'DESC' },
            skip,
            take: limit,
        });

        return { data, total, page: +page, limit: +limit };
    }

    async findOne(id: string): Promise<Course> {
        const course = await this.coursesRepository.findOne({
            where: { id },
            relations: ['mentor', 'modules', 'modules.chapters'],
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

    async findMyCourses(user: User): Promise<Course[]> {
        return await this.coursesRepository.find({
            where: { mentorId: user.id },
            // relations: ['thumbnail'],
            order: { createdAt: 'DESC' },
        });
    }

    async createModule(user: User, courseId: string, createModuleDto: CreateModuleDto): Promise<CourseModule> {
        const course = await this.coursesRepository.findOne({ where: { id: courseId } });
        if (!course) throw new NotFoundException('Course not found');

        if (course.mentorId !== user.id) {
            throw new ForbiddenException('You can only add modules to your own courses');
        }

        if (course.status !== CourseStatus.DRAFT && course.status !== CourseStatus.APPROVED) {
            throw new ForbiddenException('Cannot modify course structure unless it is in draft or approved status');
        }

        const existingModule = await this.modulesRepository.findOne({
            where: { courseId, orderIndex: createModuleDto.orderIndex }
        });

        if (existingModule) {
            throw new ConflictException(`Module with order index ${createModuleDto.orderIndex} already exists`);
        }

        const module = this.modulesRepository.create({
            ...createModuleDto,
            courseId,
        });

        return await this.modulesRepository.save(module);
    }

    async createChapter(user: User, moduleId: string, createChapterDto: CreateChapterDto): Promise<Chapter> {
        const module = await this.modulesRepository.findOne({ where: { id: moduleId }, relations: ['course'] });
        if (!module) throw new NotFoundException('Module not found');

        const course = module.course;
        if (course.mentorId !== user.id) {
            throw new ForbiddenException('You can only add chapters to your own courses');
        }

        if (course.status !== CourseStatus.DRAFT && course.status !== CourseStatus.APPROVED) {
            throw new ForbiddenException('Cannot modify course structure unless it is in draft or approved status');
        }

        const existingChapter = await this.chaptersRepository.findOne({
            where: { moduleId, orderIndex: createChapterDto.orderIndex }
        });

        if (existingChapter) {
            throw new ConflictException(`Chapter with order index ${createChapterDto.orderIndex} already exists`);
        }

        const chapter = this.chaptersRepository.create({
            title: createChapterDto.title,
            orderIndex: createChapterDto.orderIndex,
            points: createChapterDto.points || 0,
            moduleId,
        });

        return await this.chaptersRepository.save(chapter);
    }

    async createBlock(user: User, chapterId: string, createBlockDto: CreateBlockDto): Promise<LessonBlock> {
        const chapter = await this.chaptersRepository.findOne({
            where: { id: chapterId },
            relations: ['module', 'module.course']
        });
        if (!chapter) throw new NotFoundException('Chapter not found');

        const course = chapter.module.course;
        if (course.mentorId !== user.id) {
            throw new ForbiddenException('You can only modify your own courses');
        }

        if (course.status !== CourseStatus.DRAFT && course.status !== CourseStatus.APPROVED) {
            throw new ForbiddenException('Cannot modify course structure unless it is in draft or approved status');
        }

        const existingBlock = await this.blocksRepository.findOne({
            where: { chapterId, orderIndex: createBlockDto.orderIndex }
        });

        if (existingBlock) {
            throw new ConflictException(`Block with order index ${createBlockDto.orderIndex} already exists`);
        }

        const block = this.blocksRepository.create({
            ...createBlockDto,
            chapterId
        });

        return await this.blocksRepository.save(block);
    }

    async reorderModules(user: User, courseId: string, items: ReorderItemDto[]): Promise<void> {
        const course = await this.coursesRepository.findOne({ where: { id: courseId } });
        if (!course) throw new NotFoundException('Course not found');

        if (course.mentorId !== user.id) {
            throw new ForbiddenException('You can only modify your own courses');
        }

        if (course.status !== CourseStatus.DRAFT && course.status !== CourseStatus.APPROVED) {
            throw new ForbiddenException('Cannot modify course structure unless it is in draft or approved status');
        }

        await this.modulesRepository.manager.transaction(async (transactionalEntityManager) => {
            for (const item of items) {
                const result = await transactionalEntityManager.update(CourseModule,
                    { id: item.id, courseId }, // Ensure module belongs to course
                    { orderIndex: item.orderIndex }
                );
                if (result.affected === 0) {
                    throw new BadRequestException(`Module ${item.id} does not belong to course ${courseId} or does not exist`);
                }
            }
        });
    }

    async reorderChapters(user: User, moduleId: string, items: ReorderItemDto[]): Promise<void> {
        const module = await this.modulesRepository.findOne({ where: { id: moduleId }, relations: ['course'] });
        if (!module) throw new NotFoundException('Module not found');

        const course = module.course;
        if (course.mentorId !== user.id) {
            throw new ForbiddenException('You can only modify your own courses');
        }

        if (course.status !== CourseStatus.DRAFT && course.status !== CourseStatus.APPROVED) {
            throw new ForbiddenException('Cannot modify course structure unless it is in draft or approved status');
        }

        await this.chaptersRepository.manager.transaction(async (transactionalEntityManager) => {
            for (const item of items) {
                const result = await transactionalEntityManager.update(Chapter,
                    { id: item.id, moduleId }, // Ensure chapter belongs to module
                    { orderIndex: item.orderIndex }
                );
                if (result.affected === 0) {
                    throw new BadRequestException(`Chapter ${item.id} does not belong to module ${moduleId} or does not exist`);
                }
            }
        });
    }

    async reorderBlocks(user: User, chapterId: string, items: ReorderItemDto[]): Promise<void> {
        const chapter = await this.chaptersRepository.findOne({
            where: { id: chapterId },
            relations: ['module', 'module.course']
        });
        if (!chapter) throw new NotFoundException('Chapter not found');

        const course = chapter.module.course;
        if (course.mentorId !== user.id) {
            throw new ForbiddenException('You can only modify your own courses');
        }

        if (course.status !== CourseStatus.DRAFT && course.status !== CourseStatus.APPROVED) {
            throw new ForbiddenException('Cannot modify course structure unless it is in draft or approved status');
        }

        await this.blocksRepository.manager.transaction(async (transactionalEntityManager) => {
            for (const item of items) {
                const result = await transactionalEntityManager.update(LessonBlock,
                    { id: item.id, chapterId },
                    { orderIndex: item.orderIndex }
                );
                if (result.affected === 0) {
                    throw new BadRequestException(`Block ${item.id} does not belong to chapter ${chapterId} or does not exist`);
                }
            }
        });
    }

    async getUploadUrl(filename: string, contentType: string) {
        const timestamp = Math.round(new Date().getTime() / 1000);
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

        // Sanitize filename and create a public_id
        const publicId = `courses/thumbnails/${timestamp}-${filename.replace(/[^a-zA-Z0-9]/g, '_')}`;

        const signature = cloudinary.v2.utils.api_sign_request({
            timestamp: timestamp,
            public_id: publicId,
            eager: 'w_400,h_300,c_fill',
        }, process.env.CLOUDINARY_API_SECRET!);

        return {
            uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            publicUrl: `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`,
            signature,
            timestamp,
            apiKey: process.env.CLOUDINARY_API_KEY,
            cloudName,
            publicId
        };
    }

    private async generateSlug(title: string): Promise<string> {
        let slug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '');
        let uniqueSlug = slug;
        let counter = 1;

        while (await this.coursesRepository.findOne({ where: { slug: uniqueSlug } })) {
            uniqueSlug = `${slug}-${counter}`;
            counter++;
        }

        return uniqueSlug;
    }
}
