import { Controller, Get, Post, Body, Param, ParseUUIDPipe, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { Role } from '../../entities/user.entity';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('me')
    @UseGuards(AuthGuard)
    getMe(@Req() req) {
        return req.user;
    }

    @Get('admin-dashboard')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    getAdminDashboard() {
        return { message: 'Welcome Admin' };
    }

    @Get('mentor-dashboard')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.MENTOR, Role.ADMIN)
    getMentorDashboard() {
        return { message: 'Welcome Mentor' };
    }

    // Keep existing methods if needed, but protected?
    // For now, replacing to focus on the requested flow.
    @Post()
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.createUser(createUserDto);
    }
}

