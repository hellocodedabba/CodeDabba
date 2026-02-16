import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { UsersService } from '../modules/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../modules/users/dto/create-user.dto';
import { RefreshToken } from '../entities/refresh-token.entity';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        @InjectRepository(RefreshToken)
        private refreshTokenRepository: Repository<RefreshToken>,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findByEmail(email);
        if (user && (await bcrypt.compare(pass, user.password))) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const tokens = await this.getTokens(user.id, user.email, user.role);
        await this.updateRefreshToken(user.id, tokens.refresh_token);
        return {
            user,
            ...tokens,
        };
    }

    async register(createUserDto: CreateUserDto) {
        const user = await this.usersService.createUser(createUserDto);
        const tokens = await this.getTokens(user.id, user.email, user.role);
        await this.updateRefreshToken(user.id, tokens.refresh_token);
        return {
            user,
            ...tokens,
        };
    }

    async logout(userId: string) {
        await this.refreshTokenRepository.delete({ userId });
    }

    async refreshTokens(userId: string, refreshToken: string) {
        const user = await this.usersService.findById(userId);
        if (!user) throw new ForbiddenException('Access Denied');

        const tokenDoc = await this.refreshTokenRepository.findOne({
            where: { userId, token: refreshToken },
        });

        if (!tokenDoc) throw new ForbiddenException('Access Denied');

        if (tokenDoc.expiryDate < new Date()) {
            await this.refreshTokenRepository.delete(tokenDoc.id);
            throw new ForbiddenException('Refresh token expired');
        }

        const tokens = await this.getTokens(user.id, user.email, user.role);
        await this.updateRefreshToken(user.id, tokens.refresh_token);
        return tokens;
    }

    async updateRefreshToken(userId: string, refreshToken: string) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7); // 7 days expiry

        await this.refreshTokenRepository.delete({ userId }); // Ensure only one active refresh token per user for simplicity, or handle multiple devices

        await this.refreshTokenRepository.save({
            userId,
            token: refreshToken,
            expiryDate,
        });
    }

    async getTokens(userId: string, email: string, role: string) {
        const [at, rt] = await Promise.all([
            this.jwtService.signAsync(
                {
                    sub: userId,
                    email,
                    role,
                },
                {
                    expiresIn: '15m',
                    secret: 'secretKey', // TODO: use env
                },
            ),
            this.jwtService.signAsync(
                {
                    sub: userId,
                    email,
                    role,
                },
                {
                    expiresIn: '7d',
                    secret: 'refreshSecretKey', // TODO: use env
                },
            ),
        ]);

        return {
            access_token: at,
            refresh_token: rt,
        };
    }
}
