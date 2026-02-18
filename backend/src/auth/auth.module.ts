import { Module } from '@nestjs/common';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../modules/users/users.module';
import { HackathonsModule } from '../modules/hackathons/hackathons.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants, JwtStrategy } from './jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RefreshToken } from '../entities/refresh-token.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([RefreshToken]),
        UsersModule,
        HackathonsModule,
        PassportModule,
        JwtModule.register({
            secret: jwtConstants.secret,
            signOptions: { expiresIn: '60s' }, // Short expiry for demo, increase in prod
        }),
    ],
    providers: [AuthService, JwtStrategy],
    controllers: [AuthController],
    exports: [AuthService],
})
export class AuthModule { }
