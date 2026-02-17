import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TaskType } from '../../../entities/task.entity';

export class CreateTaskOptionDto {
    @IsString()
    optionText: string;

    @IsBoolean()
    isCorrect: boolean;
}

export class CreateTestCaseDto {
    @IsString()
    input: string;

    @IsString()
    expectedOutput: string;

    @IsBoolean()
    @IsOptional()
    isHidden?: boolean;
}

export class CreateTaskDto {
    @IsString()
    title: string;

    @IsEnum(TaskType)
    type: TaskType;

    @IsString()
    problemStatement: string; // Markdown

    @IsNumber()
    points: number;

    @IsBoolean()
    isRequired: boolean;

    // --- Coding fields ---
    @IsString()
    @IsOptional()
    language?: string;

    @IsString()
    @IsOptional()
    starterCode?: string;

    @IsNumber()
    @IsOptional()
    timeLimit?: number;

    @IsNumber()
    @IsOptional()
    memoryLimit?: number;

    // --- Sub-entities ---
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => CreateTaskOptionDto)
    options?: CreateTaskOptionDto[];

    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => CreateTestCaseDto)
    testCases?: CreateTestCaseDto[];
}
