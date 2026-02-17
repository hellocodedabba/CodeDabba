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


@Controller('courses')
export class CoursesController {
    constructor(private readonly coursesService: CoursesService) { }

    @Get()
    async findAll(@Query() query: any) {
        return await this.coursesService.findAll(query);
    }

    @Get('my-courses')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.MENTOR, Role.ADMIN)
    async findMyCourses(@Request() req: any) {
        return await this.coursesService.findMyCourses(req.user);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return await this.coursesService.findOne(id);
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
}
