import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File } from '../../entities/file.entity';
import { Response } from 'express';
import { Stream } from 'stream';

@Injectable()
export class FilesService {
    constructor(
        @InjectRepository(File)
        private filesRepository: Repository<File>,
    ) { }

    async uploadFile(data: Buffer, filename: string, mimetype: string): Promise<File> {
        const newFile = this.filesRepository.create({
            filename,
            mimetype,
            data,
        });
        return await this.filesRepository.save(newFile);
    }

    async getFile(id: string): Promise<File> {
        const file = await this.filesRepository.findOne({ where: { id } });
        if (!file) {
            throw new NotFoundException('File not found');
        }
        return file;
    }

    async streamFile(id: string, res: Response) {
        const file = await this.getFile(id);

        res.set({
            'Content-Type': file.mimetype,
            'Content-Disposition': `inline; filename="${file.filename}"`,
        });

        const stream = new Stream.PassThrough();
        stream.end(file.data);
        stream.pipe(res);
    }
}
