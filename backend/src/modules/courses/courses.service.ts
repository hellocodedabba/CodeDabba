import { Injectable, NotFoundException, UnauthorizedException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Not, In } from 'typeorm';
import { Course, CourseStatus, CourseVisibility, CourseAccessType } from '../../entities/course.entity';
import { Module as CourseModule } from '../../entities/module.entity';
import { Chapter } from '../../entities/chapter.entity';
import { User, Role } from '../../entities/user.entity';
import { MentorProfile } from '../../entities/mentor-profile.entity';
import { Enrollment } from '../../entities/enrollment.entity';
import { EnrollmentStatus } from '../../entities/student-profile.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { ReorderItemDto } from './dto/reorder.dto';
import * as cloudinary from 'cloudinary';
import { LessonBlock } from '../../entities/lesson-block.entity';
import { CreateBlockDto } from './dto/create-block.dto';
import { Progress } from '../../entities/progress.entity';

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
        @InjectRepository(Enrollment)
        private enrollmentsRepository: Repository<Enrollment>,
        @InjectRepository(Progress)
        private progressRepository: Repository<Progress>,
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
            status: CourseStatus.DRAFT_CURRICULUM,
            version: 1,
            visibility: CourseVisibility.PRIVATE,
        });

        return await this.coursesRepository.save(course);
    }


    async findAll(query: any = {}, userId?: string): Promise<{ data: any[], total: number, page: number, limit: number }> {
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

        // If userId is provided, check enrollment for each course
        const dataWithEnrollment = await Promise.all(data.map(async (course) => {
            const isEnrolled = userId ? await this.enrollmentsRepository.findOne({
                where: { courseId: course.id, userId }
            }) : null;
            return {
                ...course,
                isEnrolled: !!isEnrolled
            };
        }));

        return { data: dataWithEnrollment, total, page: +page, limit: +limit };
    }

    async enroll(userId: string, courseId: string): Promise<Enrollment> {
        const course = await this.coursesRepository.findOne({
            where: { id: courseId },
            relations: ['modules', 'modules.chapters']
        });
        if (!course) throw new NotFoundException('Course not found');

        if (course.status !== CourseStatus.PUBLISHED) {
            throw new BadRequestException('Course is not available for enrollment');
        }

        const existing = await this.enrollmentsRepository.findOne({
            where: { userId, courseId }
        });

        if (existing) {
            throw new ConflictException('Already enrolled in this course');
        }

        const enrollment = this.enrollmentsRepository.create({
            userId,
            courseId,
            status: EnrollmentStatus.ACTIVE
        });

        await this.enrollmentsRepository.save(enrollment);

        // Initialize Progress
        // Find first chapter
        let firstChapterId: string | undefined = undefined;
        if (course.modules && course.modules.length > 0) {
            const sortedModules = course.modules.sort((a, b) => a.orderIndex - b.orderIndex);
            const firstModule = sortedModules[0];
            if (firstModule.chapters && firstModule.chapters.length > 0) {
                const sortedChapters = firstModule.chapters.sort((a, b) => a.orderIndex - b.orderIndex);
                firstChapterId = sortedChapters[0].id;
            }
        }

        const progress = this.progressRepository.create({
            userId,
            courseId,
            currentChapterId: firstChapterId,
            completedLessonsCount: 0,
            totalPoints: 0
        });

        await this.progressRepository.save(progress);

        return enrollment;
    }

    async findAllAdmin(query: any = {}): Promise<{ data: Course[], total: number, page: number, limit: number }> {
        const { page = 1, limit = 10, status } = query;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (status) {
            where.status = status;
        }

        const [data, total] = await this.coursesRepository.findAndCount({
            where,
            relations: ['mentor'],
            order: { submittedCurriculumAt: 'DESC', createdAt: 'DESC' },
            skip,
            take: limit,
        });

        return { data, total, page: +page, limit: +limit };
    }

    async findOne(id: string, userId?: string): Promise<any> {
        const course = await this.coursesRepository.findOne({
            where: { id },
            relations: [
                'mentor',
                'modules',
                'modules.chapters',
                'modules.chapters.blocks',
                'modules.chapters.tasks',
                'modules.chapters.tasks.options',
                'modules.chapters.tasks.testCases',
            ],
            order: {
                modules: {
                    orderIndex: 'ASC',
                    chapters: {
                        orderIndex: 'ASC',
                        blocks: {
                            orderIndex: 'ASC'
                        },
                        tasks: {
                            orderIndex: 'ASC'
                        }
                    }
                }
            }
        });

        if (!course) throw new NotFoundException('Course not found');

        let isEnrolled = false;
        let progress: any = null;

        if (userId) {
            const enrollment = await this.enrollmentsRepository.findOne({
                where: { userId, courseId: id }
            });
            isEnrolled = !!enrollment;

            if (isEnrolled) {
                const prog = await this.progressRepository.findOne({ where: { userId, courseId: id } });
                if (prog) {
                    const totalChapters = await this.getCourseTotalChapters(id);
                    const percentage = totalChapters > 0 ? Math.round((prog.completedLessonsCount / totalChapters) * 100) : 0;

                    progress = {
                        percentage: Math.min(100, Math.max(0, percentage)),
                        currentChapterId: prog.currentChapterId,
                        completedChapterIds: prog.completedChapterIds || []
                    };
                }
            }
        }


        // Secure content: If not enrolled, strip blocks and tasks from non-free chapters
        if (!isEnrolled) {
            course.modules.forEach(module => {
                if (module.chapters) {
                    module.chapters.forEach(chapter => {
                        if (!chapter.isFreePreview) {
                            chapter.blocks = [];
                            chapter.tasks = [];
                        }
                    });
                }
            });
        }

        return { ...course, isEnrolled, progress };
    }

    async findEnrolledCourses(userId: string) {
        const enrollments = await this.enrollmentsRepository.find({
            where: { userId },
            relations: ['course', 'course.mentor'],
            order: { createdAt: 'DESC' }
        });

        const coursesWithProgress = await Promise.all(enrollments.map(async (enrollment) => {
            const course = enrollment.course;
            const progress = await this.progressRepository.findOne({
                where: { userId, courseId: course.id }
            });

            // Calculate progress percentage
            // Need total lessons count. 
            // We could fetch course with relations, or just count.
            // For now, let's fetch shallow course stats or rely on what we have.
            // Since we didn't fetch deep relations for course in enrollments query, we might need a separate count query or careful loading.

            // To be efficient, we might want to store totalLessons in Course or Progress.
            // For now, let's fetch Module/Chapter counts.
            const totalModules = await this.modulesRepository.count({ where: { courseId: course.id } });
            // This is rough. Total chapters is better.
            const totalChapters = await this.chaptersRepository.count({
                where: { module: { courseId: course.id } },
                relations: ['module']
            });

            const percentage = totalChapters > 0 ? Math.round((progress?.completedLessonsCount || 0) / totalChapters * 100) : 0;

            return {
                ...course,
                enrolledAt: enrollment.createdAt,
                progress: {
                    percentage,
                    completedLessons: progress?.completedLessonsCount || 0,
                    totalLessons: totalChapters,
                    currentChapterId: progress?.currentChapterId
                }
            };
        }));

        return coursesWithProgress;
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

        // Structural Change Logic
        if ([CourseStatus.CURRICULUM_UNDER_REVIEW, CourseStatus.CONTENT_UNDER_REVIEW, CourseStatus.PUBLISHED].includes(course.status)) {
            throw new ForbiddenException(`Cannot add modules while course is ${course.status.replace(/_/g, ' ')}.`);
        }

        // If structure changes after curriculum is approved/content is drafted -> Reset to curriculum draft
        if ([CourseStatus.CURRICULUM_APPROVED, CourseStatus.CONTENT_DRAFT].includes(course.status)) {
            course.status = CourseStatus.DRAFT_CURRICULUM;
            await this.coursesRepository.save(course);
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

        // Structural Change Logic
        if ([CourseStatus.CURRICULUM_UNDER_REVIEW, CourseStatus.CONTENT_UNDER_REVIEW, CourseStatus.PUBLISHED].includes(course.status)) {
            throw new ForbiddenException(`Cannot add chapters while course is ${course.status.replace(/_/g, ' ')}.`);
        }

        // Reset to curriculum draft if modifying structure after approval
        if ([CourseStatus.CURRICULUM_APPROVED, CourseStatus.CONTENT_DRAFT].includes(course.status)) {
            course.status = CourseStatus.DRAFT_CURRICULUM;
            await this.coursesRepository.save(course);
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
            isFreePreview: createChapterDto.isFreePreview || false,
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

        // Phase 2 Editing: Content
        const lockedStatuses = [CourseStatus.DRAFT_CURRICULUM, CourseStatus.CURRICULUM_UNDER_REVIEW, CourseStatus.CONTENT_UNDER_REVIEW, CourseStatus.PUBLISHED];

        if (lockedStatuses.includes(course.status)) {
            throw new ForbiddenException(`Cannot edit content while course is ${course.status.replace(/_/g, ' ')}.`);
        }

        // Auto-transition to CONTENT_DRAFT if currently CURRICULUM_APPROVED
        if (course.status === CourseStatus.CURRICULUM_APPROVED) {
            course.status = CourseStatus.CONTENT_DRAFT;
            await this.coursesRepository.save(course);
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

        if ([CourseStatus.CURRICULUM_UNDER_REVIEW, CourseStatus.CONTENT_UNDER_REVIEW, CourseStatus.PUBLISHED].includes(course.status)) {
            throw new ForbiddenException(`Cannot reorder modules while course is ${course.status.replace(/_/g, ' ')}.`);
        }

        // Reset to curriculum draft if modifying structure after approval
        if ([CourseStatus.CURRICULUM_APPROVED, CourseStatus.CONTENT_DRAFT].includes(course.status)) {
            course.status = CourseStatus.DRAFT_CURRICULUM;
            await this.coursesRepository.save(course);
        }

        await this.modulesRepository.manager.transaction(async (transactionalEntityManager) => {
            for (const item of items) {
                const result = await transactionalEntityManager.update(CourseModule,
                    { id: item.id, courseId },
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

        if ([CourseStatus.CURRICULUM_UNDER_REVIEW, CourseStatus.CONTENT_UNDER_REVIEW, CourseStatus.PUBLISHED].includes(course.status)) {
            throw new ForbiddenException(`Cannot reorder chapters while course is ${course.status.replace(/_/g, ' ')}.`);
        }

        // Reset to curriculum draft if modifying structure after approval
        if ([CourseStatus.CURRICULUM_APPROVED, CourseStatus.CONTENT_DRAFT].includes(course.status)) {
            course.status = CourseStatus.DRAFT_CURRICULUM;
            await this.coursesRepository.save(course);
        }

        await this.chaptersRepository.manager.transaction(async (transactionalEntityManager) => {
            for (const item of items) {
                const result = await transactionalEntityManager.update(Chapter,
                    { id: item.id, moduleId },
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

        // Implicitly switches to CONTENT_DRAFT? Maybe not for reorder, but check permissions.
        const allowedContentEditStatuses = [
            CourseStatus.CURRICULUM_APPROVED,
            CourseStatus.CONTENT_DRAFT,
            CourseStatus.CONTENT_REJECTED
        ];

        if (!allowedContentEditStatuses.includes(course.status)) {
            throw new ForbiddenException('Cannot edit content (reorder blocks). Check course status.');
        }

        if (course.status === CourseStatus.CURRICULUM_APPROVED) {
            course.status = CourseStatus.CONTENT_DRAFT;
            await this.coursesRepository.save(course);
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

    // --- Phase 1: Curriculum Workflow ---

    async submitCurriculum(user: User, courseId: string): Promise<Course> {
        const course = await this.coursesRepository.findOne({ where: { id: courseId } });
        if (!course) throw new NotFoundException('Course not found');
        if (course.mentorId !== user.id) throw new ForbiddenException('Not your course');

        if (course.status !== CourseStatus.DRAFT_CURRICULUM) {
            throw new BadRequestException('Can only submit curriculum from DRAFT CURRICULUM status');
        }

        course.status = CourseStatus.CURRICULUM_UNDER_REVIEW;
        course.submittedCurriculumAt = new Date();
        return await this.coursesRepository.save(course);
    }

    async approveCurriculum(user: User, courseId: string): Promise<Course> {
        if (user.role !== Role.ADMIN) throw new ForbiddenException('Admin only');

        const course = await this.coursesRepository.findOne({ where: { id: courseId } });
        if (!course) throw new NotFoundException('Course not found');

        if (course.status !== CourseStatus.CURRICULUM_UNDER_REVIEW) {
            throw new BadRequestException('Course curriculum is not under review');
        }

        course.status = CourseStatus.CURRICULUM_APPROVED;
        course.curriculumReviewedAt = new Date();
        course.rejectReason = null;
        return await this.coursesRepository.save(course);
    }

    async rejectCurriculum(user: User, courseId: string, reason: string): Promise<Course> {
        if (user.role !== Role.ADMIN) throw new ForbiddenException('Admin only');

        const course = await this.coursesRepository.findOne({ where: { id: courseId } });
        if (!course) throw new NotFoundException('Course not found');

        if (course.status !== CourseStatus.CURRICULUM_UNDER_REVIEW) {
            throw new BadRequestException('Course curriculum is not under review');
        }

        course.status = CourseStatus.DRAFT_CURRICULUM;
        course.rejectReason = reason;
        return await this.coursesRepository.save(course);
    }

    // --- Phase 2: Content Workflow ---

    async submitContent(user: User, courseId: string): Promise<Course> {
        const course = await this.coursesRepository.findOne({ where: { id: courseId } });
        if (!course) throw new NotFoundException('Course not found');
        if (course.mentorId !== user.id) throw new ForbiddenException('Not your course');

        if (course.status !== CourseStatus.CONTENT_DRAFT) {
            throw new BadRequestException('Can only submit content from CONTENT DRAFT status');
        }

        course.status = CourseStatus.CONTENT_UNDER_REVIEW;
        course.submittedContentAt = new Date();
        return await this.coursesRepository.save(course);
    }

    async approveContent(user: User, courseId: string): Promise<Course> {
        if (user.role !== Role.ADMIN) throw new ForbiddenException('Admin only');

        const course = await this.coursesRepository.findOne({ where: { id: courseId } });
        if (!course) throw new NotFoundException('Course not found');

        if (course.status !== CourseStatus.CONTENT_UNDER_REVIEW) {
            throw new BadRequestException('Course content is not under review');
        }

        course.status = CourseStatus.PUBLISHED;
        course.publishedAt = new Date();
        course.contentReviewedAt = new Date();
        course.publishedById = user.id;
        course.visibility = CourseVisibility.PUBLIC;
        course.rejectReason = null;

        return await this.coursesRepository.save(course);
    }

    async rejectContent(user: User, courseId: string, reason: string): Promise<Course> {
        if (user.role !== Role.ADMIN) throw new ForbiddenException('Admin only');

        const course = await this.coursesRepository.findOne({ where: { id: courseId } });
        if (!course) throw new NotFoundException('Course not found');

        if (course.status !== CourseStatus.CONTENT_UNDER_REVIEW) {
            throw new BadRequestException('Course content is not under review');
        }

        course.status = CourseStatus.CONTENT_DRAFT;
        course.rejectReason = reason;
        return await this.coursesRepository.save(course);
    }

    // Kept for signature compatibility if used elsewhere, but internally we use toggleChapterFreeStatus
    async toggleChapterFreeStatus(user: User, chapterId: string, isFreePreview: boolean): Promise<Chapter> {
        const chapter = await this.chaptersRepository.findOne({
            where: { id: chapterId },
            relations: ['module', 'module.course']
        });
        if (!chapter) throw new NotFoundException('Chapter not found');

        const course = chapter.module.course;
        if (course.mentorId !== user.id) {
            throw new ForbiddenException('You can only modify your own courses');
        }

        // This is a flag change, effectively "structure" or "meta". 
        // Allowed in DRAFT/CURR_REJECTED. 
        // Should it be allowed later? "Free preview flags" are listed in Phase 1. 
        // Let's restrict to Phase 1 for now to force curriculum correctness.
        if ([CourseStatus.DRAFT_CURRICULUM, CourseStatus.CURRICULUM_REJECTED].indexOf(course.status) === -1) {
            // Maybe allow admin to toggle later? Or mentor in next version?
            // For now adhere to Phase 1.
            throw new ForbiddenException('Cannot change free preview flags after curriculum approval');
        }

        chapter.isFreePreview = isFreePreview;
        return await this.chaptersRepository.save(chapter);
    }

    // Deprecated methods replaced by specific workflow methods above
    // keeping skeletons if needed or just remove? I'll remove them.

    async completeChapter(user: User, courseId: string, chapterId: string): Promise<any> {
        // Find course and check ownership? Or just enrollment?
        // Enrollment matters.
        const enrollment = await this.enrollmentsRepository.findOne({ where: { userId: user.id, courseId } });
        if (!enrollment) {
            throw new ForbiddenException('You must be enrolled in this course');
        }

        // Find chapter
        const chapter = await this.chaptersRepository.findOne({
            where: { id: chapterId },
            relations: ['module']
        });
        if (!chapter) throw new NotFoundException('Chapter not found');
        if (chapter.module.courseId !== courseId) throw new BadRequestException('Chapter does not belong to this course');

        // Find or create progress
        let progress = await this.progressRepository.findOne({ where: { userId: user.id, courseId } });
        if (!progress) {
            progress = this.progressRepository.create({
                userId: user.id,
                courseId,
                completedChapterIds: [],
                completedLessonsCount: 0,
                totalPoints: 0
            });
        }

        // Check if already completed
        if (!progress.completedChapterIds) progress.completedChapterIds = [];
        if (!progress.completedChapterIds.includes(chapterId)) {
            progress.completedChapterIds.push(chapterId);
            progress.completedLessonsCount += 1;
            progress.totalPoints += chapter.points || 0; // Assuming chapter has points logic

            // Logic to find next chapter
            // Current chapter order
            const currentOrder = chapter.orderIndex;
            const currentModuleId = chapter.moduleId;

            // Find next chapter in same module
            let nextChapter = await this.chaptersRepository.findOne({
                where: {
                    moduleId: currentModuleId,
                    orderIndex: currentOrder + 1
                }
            });

            if (!nextChapter) {
                // Find next module
                const currentModule = await this.modulesRepository.findOne({ where: { id: currentModuleId } });
                const nextModule = await this.modulesRepository.findOne({
                    where: {
                        courseId,
                        orderIndex: (currentModule?.orderIndex || 0) + 1
                    }
                });

                if (nextModule) {
                    // First chapter of next module
                    nextChapter = await this.chaptersRepository.findOne({
                        where: { moduleId: nextModule.id, orderIndex: 0 }
                    });
                    // If no order index 0? Check lowest
                    if (!nextChapter) {
                        // Or just first one
                        const firstChapter = await this.chaptersRepository.findOne({
                            where: { moduleId: nextModule.id },
                            order: { orderIndex: 'ASC' }
                        });
                        nextChapter = firstChapter || null;
                    }
                }
            }

            if (nextChapter) {
                progress.currentChapterId = nextChapter.id;
            }

            await this.progressRepository.save(progress);
        }

        return {
            completed: true,
            progress: {
                percentage: Math.min(100, Math.round((progress.completedLessonsCount / (await this.getCourseTotalChapters(courseId) || 1)) * 100)),
                currentChapterId: progress.currentChapterId,
                completedChapterIds: progress.completedChapterIds
            }
        };
    }

    private async getCourseTotalChapters(courseId: string): Promise<number> {
        return await this.chaptersRepository.count({
            where: { module: { courseId } },
            relations: ['module']
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
