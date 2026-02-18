import { IsString, IsInt, MinLength, Min, IsOptional, IsUrl, IsBoolean } from 'class-validator';

export class CreateChapterDto {
    @IsString()
    @MinLength(3, { message: 'Title must be at least 3 characters long' })
    title: string;

    @IsInt()
    @Min(0, { message: 'Order index must be non-negative' })
    orderIndex: number;

    @IsOptional()
    @IsString()
    notesMarkdown?: string;

    @IsOptional()
    @IsUrl({}, { message: 'Video URL must be a valid URL' })
    videoUrl?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    points?: number;

    @IsOptional()
    @IsBoolean()
    isFreePreview?: boolean;
}
