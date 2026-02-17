import { IsString, IsNumber } from 'class-validator';

export class ReorderTaskItemDto {
    @IsString()
    id: string;

    @IsNumber()
    order_index: number;
}
