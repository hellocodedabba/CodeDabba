import { IsOptional, IsString, IsUrl } from 'class-validator';

export class SubmitRoundDto {
    @IsOptional()
    @IsUrl()
    githubLink?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsUrl()
    videoUrl?: string;

    // zipUrl is handled via file upload if present
}
