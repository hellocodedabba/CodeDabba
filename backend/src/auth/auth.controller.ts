import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../modules/users/dto/create-user.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    async login(@Body() body) {
        // Validate user first
        // Assuming body has email and password
        const validUser = await this.authService.validateUser(body.email, body.password);
        if (!validUser) {
            return { message: 'Invalid credentials' }; // Or throw UnauthorizedException
        }
        return this.authService.login(validUser);
    }

    @Post('register')
    async register(@Body() createUserDto: CreateUserDto) {
        return this.authService.register(createUserDto);
    }
}
