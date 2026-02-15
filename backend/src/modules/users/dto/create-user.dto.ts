import { IsEmail, IsOptional, IsEnum, IsString, MinLength, Matches } from 'class-validator';
import { Role } from '../../../entities/user.entity';

export class CreateUserDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    @Matches(/^[0-9]{10}$/, { message: 'Mobile number must be 10 digits' })
    mobileNumber?: string;

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsEnum(Role)
    role?: Role;
}
