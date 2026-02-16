import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CoursesService } from './courses.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../entities/user.entity';
import { RolesGuard } from '../../common/guards/roles.guard';

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
        return await this.coursesService.findMyCourses(req.user.id);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return await this.coursesService.findOne(id);
    }

    @Post()
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.MENTOR, Role.ADMIN)
    async create(@Request() req: any, @Body() body: any) {
        return await this.coursesService.createCourse(req.user, body);
    }

    @Post(':id/modules')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.MENTOR, Role.ADMIN)
    async createModule(@Param('id') id: string, @Body() body: { title: string; orderIndex: number }) {
        return await this.coursesService.createModule(id, body.title, body.orderIndex);
    }

    @Post('modules/:moduleId/chapters')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.MENTOR, Role.ADMIN)
    async createChapter(@Param('moduleId') moduleId: string, @Body() body: { title: string; content: string; orderIndex: number }) {
        return await this.coursesService.createChapter(moduleId, body.title, body.content, body.orderIndex);
    }
}
