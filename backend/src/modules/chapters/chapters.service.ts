import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Chapter } from '../../entities/chapter.entity';
import { Role } from '../../entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { LessonBlock } from '../../entities/lesson-block.entity';
import { CreateLessonBlockDto } from './dto/create-lesson-block.dto';
import { CourseStatus, Course } from '../../entities/course.entity';
import { Enrollment } from '../../entities/enrollment.entity';
import * as cloudinary from 'cloudinary';


@Injectable()
export class ChaptersService {
    constructor(
        @InjectRepository(Chapter)
        private chaptersRepository: Repository<Chapter>,
        @InjectRepository(LessonBlock)
        private lessonBlockRepository: Repository<LessonBlock>,
        private dataSource: DataSource,
    ) {
        cloudinary.v2.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
    }

    async createBlock(chapterId: string, createBlockDto: CreateLessonBlockDto, userId: string): Promise<LessonBlock> {
        const chapter = await this.chaptersRepository.findOne({
            where: { id: chapterId },
            relations: ['module', 'module.course'],
        });

        if (!chapter) {
            throw new NotFoundException('Chapter not found');
        }

        const course = chapter.module.course;

        if (course.mentorId !== userId) {
            throw new ForbiddenException('You are not authorized to modify this course');
        }

        if (course.status !== CourseStatus.DRAFT && course.status !== CourseStatus.REJECTED) {
            throw new BadRequestException('You can only modify courses in DRAFT or REJECTED status');
        }

        const lastBlock = await this.lessonBlockRepository.findOne({
            where: { chapterId },
            order: { orderIndex: 'DESC' },
        });

        const newOrderIndex = (lastBlock?.orderIndex || 0) + 1;

        const block = this.lessonBlockRepository.create({
            ...createBlockDto,
            chapterId,
            orderIndex: newOrderIndex,
        });

        return this.lessonBlockRepository.save(block);
    }

    async reorderBlocks(chapterId: string, blocks: { id: string; order_index: number }[], userId: string): Promise<void> {
        const chapter = await this.chaptersRepository.findOne({
            where: { id: chapterId },
            relations: ['module', 'module.course'],
        });

        if (!chapter) {
            throw new NotFoundException('Chapter not found');
        }

        const course = chapter.module.course;

        if (course.mentorId !== userId) {
            throw new ForbiddenException('You are not authorized to modify this course');
        }

        // Use a transaction to ensure all updates succeed or fail together
        await this.dataSource.transaction(async (manager) => {
            for (const block of blocks) {
                // Verify the block belongs to the chapter to prevent moving blocks between chapters
                // Also ensures we are updating the correct block
                const result = await manager.update(
                    LessonBlock,
                    { id: block.id, chapterId: chapterId },
                    { orderIndex: block.order_index }
                );

                if (result.affected === 0) {
                    // Optionally warn or throw if a block wasn't found/updated
                    // For now, we proceed, assuming the frontend sends valid data
                }
            }
        });
    }

    async deleteBlock(chapterId: string, blockId: string, userId: string): Promise<void> {
        // We need to verify ownership via chapter -> module -> course
        // Using chapterId ensures the block belongs to the chapter we expect
        const block = await this.lessonBlockRepository.findOne({
            where: { id: blockId, chapterId },
            relations: ['chapter', 'chapter.module', 'chapter.module.course'],
        });

        if (!block) {
            // Check if block exists at all to give better error? 
            // Or just not found.
            throw new NotFoundException('Block not found');
        }

        const course = block.chapter.module.course;

        if (course.mentorId !== userId) {
            throw new ForbiddenException('Not authorized');
        }

        // Soft delete
        await this.lessonBlockRepository.softDelete(blockId);
    }
    async findOne(id: string, user: any): Promise<Chapter> {
        const chapter = await this.chaptersRepository.findOne({
            where: { id },
            relations: ['blocks', 'module', 'module.course', 'tasks', 'tasks.options', 'tasks.testCases'],
            order: {
                blocks: {
                    orderIndex: 'ASC',
                },
                tasks: {
                    orderIndex: 'ASC',
                },
            },
        });

        if (!chapter) {
            throw new NotFoundException('Chapter not found');
        }

        const course = chapter.module.course;

        // Allow access if user is the mentor or an admin.
        if (user?.role === Role.ADMIN) {
            return chapter;
        }

        if (course.mentorId !== user?.id) {
            throw new ForbiddenException('You are not authorized to view/edit this chapter');
        }

        return chapter;
    }

    async getUploadSignature(folder: string) {
        const timestamp = Math.round(new Date().getTime() / 1000);
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

        const signature = cloudinary.v2.utils.api_sign_request({
            timestamp: timestamp,
            folder: folder,
        }, process.env.CLOUDINARY_API_SECRET!);

        return {
            uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
            signature,
            timestamp,
            apiKey: process.env.CLOUDINARY_API_KEY,
            cloudName,
            folder
        };
    }
    async updateBlock(chapterId: string, blockId: string, updateData: { content: string }, userId: string): Promise<LessonBlock> {
        const block = await this.lessonBlockRepository.findOne({
            where: { id: blockId, chapterId },
            relations: ['chapter', 'chapter.module', 'chapter.module.course'],
        });

        if (!block) {
            throw new NotFoundException('Block not found');
        }

        const course = block.chapter.module.course;

        // Check ownership
        if (course.mentorId !== userId) {
            throw new ForbiddenException('Not authorized');
        }

        if (course.status !== CourseStatus.DRAFT && course.status !== CourseStatus.REJECTED) {
            throw new BadRequestException('You can only modify courses in DRAFT or REJECTED status');
        }

        block.content = updateData.content;
        return this.lessonBlockRepository.save(block);
    }

    async getChapterContentForStudent(chapterId: string, userId?: string): Promise<Chapter> {
        const chapter = await this.chaptersRepository.findOne({
            where: { id: chapterId },
            relations: ['blocks', 'module', 'module.course', 'tasks', 'tasks.options', 'tasks.testCases'],
            order: {
                blocks: {
                    orderIndex: 'ASC',
                },
                tasks: {
                    orderIndex: 'ASC',
                },
            },
        });

        if (!chapter) throw new NotFoundException('Chapter not found');

        const course = chapter.module.course;

        // Lesson Access Logic
        if (course.accessType === 'free') {
            return chapter; // Always allow free courses
        }

        if (chapter.isFreePreview) {
            return chapter; // Allow free previews
        }

        if (!userId) {
            throw new ForbiddenException('Identification required to access this content');
        }

        // Check if user is the mentor of the course
        if (course.mentorId === userId) {
            return chapter;
        }

        // Check enrollment
        const isEnrolled = await this.dataSource.getRepository(Enrollment).findOne({
            where: { courseId: course.id, userId, status: 'active' as any }
        });

        if (!isEnrolled) {
            throw new ForbiddenException('You must be enrolled to access this content');
        }

        return chapter;
    }
}
