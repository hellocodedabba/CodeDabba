import { IsString, IsInt, MinLength, Min, IsUUID } from 'class-validator';

export class CreateModuleDto {
    @IsString()
    @MinLength(3, { message: 'Title must be at least 3 characters long' })
    title: string;

    @IsInt()
    @Min(0, { message: 'Order index must be non-negative' })
    orderIndex: number;
}
