import { IsString, IsInt, Min, IsUUID, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ReorderItemDto {
    @IsUUID()
    id: string;

    @IsInt()
    @Min(0)
    orderIndex: number;
}
