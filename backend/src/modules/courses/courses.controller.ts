import { Controller, Get, Post, Body, Param, UseGuards, Request, Query, Patch } from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { ReorderItemDto } from './dto/reorder.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CoursesService } from './courses.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../entities/user.entity';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateBlockDto } from './dto/create-block.dto';
import { OptionalAuthGuard } from '../../common/guards/optional-auth.guard';


@Controller('courses')
export class CoursesController {
    constructor(private readonly coursesService: CoursesService) { }

    @Get()
    @UseGuards(OptionalAuthGuard)
    async findAll(@Request() req: any, @Query() query: any) {
        return await this.coursesService.findAll(query, req.user?.id);
    }

    @Get('admin/all')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async findAllAdmin(@Query() query: any) {
        return await this.coursesService.findAllAdmin(query);
    }

    @Get('enrolled')
    @UseGuards(AuthGuard)
    async getEnrolledCourses(@Request() req: any) {
        // We'll implement this service method next
        return await this.coursesService.findEnrolledCourses(req.user.id);
    }

    @Get('my-courses')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.MENTOR, Role.ADMIN)
    async findMyCourses(@Request() req: any) {
        return await this.coursesService.findMyCourses(req.user);
    }

    @Get(':id')
    @UseGuards(OptionalAuthGuard)
    async findOne(@Request() req: any, @Param('id') id: string) {
        return await this.coursesService.findOne(id, req.user?.id);
    }
    @Post('upload-thumbnail')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.MENTOR, Role.ADMIN)
    async uploadThumbnail(@Body() body: { filename: string, contentType: string }) {
        return await this.coursesService.getUploadUrl(body.filename, body.contentType);
    }


    @Post()
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.MENTOR)
    async create(@Request() req: any, @Body() body: CreateCourseDto) {
        return await this.coursesService.createCourse(req.user, body);
    }

    @Post(':id/modules')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.MENTOR, Role.ADMIN)
    async createModule(@Request() req: any, @Param('id') id: string, @Body() body: CreateModuleDto) {
        return await this.coursesService.createModule(req.user, id, body);
    }

    @Post('modules/:moduleId/chapters')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.MENTOR, Role.ADMIN)
    async createChapter(@Request() req: any, @Param('moduleId') moduleId: string, @Body() body: CreateChapterDto) {
        return await this.coursesService.createChapter(req.user, moduleId, body);
    }

    @Post('chapters/:chapterId/blocks')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.MENTOR, Role.ADMIN)
    async createBlock(@Request() req: any, @Param('chapterId') chapterId: string, @Body() body: CreateBlockDto) {
        return await this.coursesService.createBlock(req.user, chapterId, body);
    }

    @Patch(':id/modules/reorder')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.MENTOR, Role.ADMIN)
    async reorderModules(@Request() req: any, @Param('id') id: string, @Body() body: ReorderItemDto[]) {
        return await this.coursesService.reorderModules(req.user, id, body);
    }

    @Patch('modules/:moduleId/chapters/reorder')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.MENTOR, Role.ADMIN)
    async reorderChapters(@Request() req: any, @Param('moduleId') moduleId: string, @Body() body: ReorderItemDto[]) {
        return await this.coursesService.reorderChapters(req.user, moduleId, body);
    }

    @Patch('chapters/:chapterId/blocks/reorder')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.MENTOR, Role.ADMIN)
    async reorderBlocks(@Request() req: any, @Param('chapterId') chapterId: string, @Body() body: ReorderItemDto[]) {
        return await this.coursesService.reorderBlocks(req.user, chapterId, body);
    }

    @Patch('chapters/:chapterId/free')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.MENTOR, Role.ADMIN)
    async toggleChapterFreeStatus(@Request() req: any, @Param('chapterId') chapterId: string, @Body() body: { isFreePreview: boolean }) {
        // Enforce boolean if not done automatically
        return await this.coursesService.toggleChapterFreeStatus(req.user, chapterId, !!body.isFreePreview);
    }

    @Post(':id/submit-curriculum')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.MENTOR)
    async submitCurriculum(@Request() req: any, @Param('id') id: string) {
        return await this.coursesService.submitCurriculum(req.user, id);
    }

    @Post(':id/approve-curriculum')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async approveCurriculum(@Request() req: any, @Param('id') id: string) {
        return await this.coursesService.approveCurriculum(req.user, id);
    }

    @Post(':id/reject-curriculum')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async rejectCurriculum(@Request() req: any, @Param('id') id: string, @Body('reason') reason: string) {
        return await this.coursesService.rejectCurriculum(req.user, id, reason);
    }

    @Post(':id/submit-content')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.MENTOR)
    async submitContent(@Request() req: any, @Param('id') id: string) {
        return await this.coursesService.submitContent(req.user, id);
    }

    @Post(':id/approve-content')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async approveContent(@Request() req: any, @Param('id') id: string) {
        return await this.coursesService.approveContent(req.user, id);
    }

    @Post(':id/reject-content')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async rejectContent(@Request() req: any, @Param('id') id: string, @Body('reason') reason: string) {
        return await this.coursesService.rejectContent(req.user, id, reason);
    }

    @Post(':id/enroll')
    @UseGuards(AuthGuard)
    async enroll(@Request() req: any, @Param('id') id: string) {
        return await this.coursesService.enroll(req.user, id);
    }

    @Post(':id/chapters/:chapterId/complete')
    @UseGuards(AuthGuard)
    async completeChapter(@Request() req: any, @Param('id') courseId: string, @Param('chapterId') chapterId: string) {
        return await this.coursesService.completeChapter(req.user, courseId, chapterId);
    }
}
