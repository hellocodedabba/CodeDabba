import { IsString, IsEnum, IsNumber, Min } from 'class-validator';
import { BlockType } from '../../../entities/lesson-block.entity';

export class CreateBlockDto {
    @IsEnum(BlockType)
    type: BlockType;

    @IsString()
    content: string;

    @IsNumber()
    @Min(0)
    orderIndex: number;
}
