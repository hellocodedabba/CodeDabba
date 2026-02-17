import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { BlockType } from '../../../entities/lesson-block.entity';

export class CreateLessonBlockDto {
    @IsEnum(BlockType)
    @IsNotEmpty()
    type: BlockType;

    @IsString()
    @IsNotEmpty()
    content: string;
}
