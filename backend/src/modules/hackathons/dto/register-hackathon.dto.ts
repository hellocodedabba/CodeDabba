import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean, IsArray, IsEmail, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RegistrationType } from '../../../entities/hackathon-registration.entity';

export class RegisterMemberDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    mobile: string;

    @IsEmail()
    @IsOptional()
    collegeEmail?: string;

    @IsString()
    @IsOptional()
    highestQualification?: string;
}

export class RegisterHackathonDto {
    @IsEnum(RegistrationType)
    registrationType: RegistrationType;

    @IsString()
    @IsOptional()
    teamName?: string;

    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => RegisterMemberDto)
    members?: RegisterMemberDto[];

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    mobile: string;

    @IsEmail()
    @IsOptional()
    collegeEmail?: string;

    @IsString()
    @IsOptional()
    highestQualification?: string;
}
