import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum, IsNumber, IsBoolean, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { HackathonStatus } from '../../../entities/hackathon.entity';

class CreateRoundDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsDateString()
    startDate: string;

    @IsDateString()
    endDate: string;

    @IsBoolean()
    @IsOptional()
    isElimination?: boolean;

    @IsNumber()
    @IsOptional()
    @Min(0)
    eliminationCount?: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    weightagePercentage?: number;

    @IsBoolean()
    @IsOptional()
    allowZip?: boolean;

    @IsBoolean()
    @IsOptional()
    allowGithub?: boolean;

    @IsBoolean()
    @IsOptional()
    allowVideo?: boolean;

    @IsBoolean()
    @IsOptional()
    allowDescription?: boolean;

    @IsNumber()
    @IsOptional()
    @Min(1)
    maxFileSizeMb?: number;

    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    allowedFileTypes?: string[];
}

export class CreateHackathonDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsString()
    @IsOptional()
    bannerUrl?: string;

    @IsString()
    @IsOptional()
    rules?: string;

    @IsString()
    @IsOptional()
    evaluationCriteria?: string;

    @IsDateString()
    registrationStart: string;

    @IsDateString()
    registrationEnd: string;

    @IsDateString()
    startDate: string;

    @IsDateString()
    endDate: string;

    @IsNumber()
    @IsOptional()
    @Min(1)
    maxTeamSize?: number;

    @IsNumber()
    @IsOptional()
    @Min(1)
    maxParticipants?: number;

    @IsBoolean()
    @IsOptional()
    allowIndividual?: boolean;

    @IsBoolean()
    @IsOptional()
    allowTeam?: boolean;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateRoundDto)
    rounds: CreateRoundDto[];
}
