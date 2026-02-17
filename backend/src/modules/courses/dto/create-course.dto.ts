import { IsString, MinLength, IsEnum, IsArray, IsNumber, IsOptional } from 'class-validator';
import { CourseLevel, CourseAccessType } from '../../../entities/course.entity';

export class CreateCourseDto {
    @IsString()
    @MinLength(5)
    title: string;

    @IsString()
    @MinLength(20)
    description: string;

    @IsEnum(CourseLevel)
    level: CourseLevel;

    @IsArray()
    @IsString({ each: true })
    tags: string[];

    @IsString()
    category: string;

    @IsNumber()
    price: number;

    @IsEnum(CourseAccessType)
    accessType: CourseAccessType;

    @IsOptional()
    @IsString()
    thumbnailId?: string;
}
