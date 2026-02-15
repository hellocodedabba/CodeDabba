import { IsEmail, IsOptional, IsEnum, IsString } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
    @IsEmail()
    email: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsEnum(Role)
    role?: Role;
}
