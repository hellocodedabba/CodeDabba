import { Controller, Post, Body, UseGuards, Request, Get, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../modules/users/dto/create-user.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    async login(@Body() body) {
        // Validate user first
        const validUser = await this.authService.validateUser(body.email, body.password);
        if (!validUser) {
            throw new UnauthorizedException('Invalid credentials');
        }
        return this.authService.login(validUser);
    }

    @Post('register')
    async register(@Body() createUserDto: CreateUserDto) {
        return this.authService.register(createUserDto);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(@Request() req) {
        return this.authService.logout(req.user['id']);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refreshTokens(@Body() body: { userId: string; refreshToken: string }) {
        return this.authService.refreshTokens(body.userId, body.refreshToken);
    }

    @Post('google')
    async googleLogin(@Body('token') token: string) {
        return this.authService.loginWithGoogle(token);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('set-password')
    async setPassword(@Request() req, @Body('password') password: string) {
        return this.authService.setPassword(req.user.sub, password);
    }
}
