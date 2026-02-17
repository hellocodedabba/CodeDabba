import { IsArray, IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ReorderLessonBlockItemDto {
    @IsString()
    @IsNotEmpty()
    id: string;

    @IsNumber()
    @IsNotEmpty()
    order_index: number;
}

export class ReorderLessonBlocksDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ReorderLessonBlockItemDto)
    blocks: ReorderLessonBlockItemDto[];
}
