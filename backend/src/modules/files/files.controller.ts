import { Controller, Post, Get, Param, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import type { Response } from 'express'; // Fix linter error
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Multer } from 'multer'; // Ensure Multer types are loaded

@Controller('files')
export class FilesController {
    constructor(private readonly filesService: FilesService) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        const savedFile = await this.filesService.uploadFile(
            file.buffer,
            file.originalname,
            file.mimetype,
        );
        return {
            id: savedFile.id,
            filename: savedFile.filename,
            url: `/api/v1/files/${savedFile.id}`, // Assuming global prefix is /api/v1
        };
    }

    @Get(':id')
    async getFile(@Param('id') id: string, @Res() res: Response) {
        await this.filesService.streamFile(id, res);
    }
}
