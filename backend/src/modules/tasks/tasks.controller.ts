import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ReorderTaskItemDto } from './dto/reorder-task.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../entities/user.entity';

@Controller('chapters/:chapterId/tasks')
@UseGuards(AuthGuard, RolesGuard)
export class TasksController {
    constructor(private readonly tasksService: TasksService) { }

    @Post()
    @Roles(Role.MENTOR, Role.ADMIN)
    create(
        @Param('chapterId') chapterId: string,
        @Body() createTaskDto: CreateTaskDto,
        @Request() req: any,
    ) {
        return this.tasksService.create(chapterId, createTaskDto, req.user.id);
    }

    @Get()
    @Roles(Role.MENTOR, Role.ADMIN)
    findAll(@Param('chapterId') chapterId: string) {
        return this.tasksService.findAll(chapterId);
    }

    @Patch('reorder')
    @Roles(Role.MENTOR, Role.ADMIN)
    reorder(
        @Param('chapterId') chapterId: string,
        @Body() items: ReorderTaskItemDto[],
        @Request() req: any,
    ) {
        return this.tasksService.reorder(chapterId, items, req.user.id);
    }

    @Patch(':id')
    @Roles(Role.MENTOR, Role.ADMIN)
    update(
        @Param('id') id: string,
        @Body() updateTaskDto: UpdateTaskDto,
        @Request() req: any,
    ) {
        return this.tasksService.update(id, updateTaskDto, req.user.id);
    }

    @Delete(':id')
    @Roles(Role.MENTOR, Role.ADMIN)
    remove(
        @Param('id') id: string,
        @Request() req: any,
    ) {
        return this.tasksService.remove(id, req.user.id);
    }
}
