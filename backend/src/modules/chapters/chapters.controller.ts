import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { ChaptersService } from './chapters.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../entities/user.entity';
import { CreateLessonBlockDto } from './dto/create-lesson-block.dto';
import { ReorderLessonBlockItemDto, ReorderLessonBlocksDto } from './dto/reorder-lesson-blocks.dto';
import { ParseArrayPipe } from '@nestjs/common';

@Controller('chapters')
export class ChaptersController {
    constructor(private readonly chaptersService: ChaptersService) { }

    @Get(':id')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.MENTOR, Role.ADMIN)
    async findOne(@Request() req: any, @Param('id') id: string) {
        return this.chaptersService.findOne(id, req.user);
    }

    @Get('content/:id')
    // No RolesGuard here, allow student role too
    async findContent(@Request() req: any, @Param('id') id: string) {
        return this.chaptersService.getChapterContentForStudent(id, req.user?.id);
    }

    @Post(':id/blocks')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.MENTOR, Role.ADMIN)
    async createBlock(
        @Request() req: any,
        @Param('id') id: string,
        @Body() createBlockDto: CreateLessonBlockDto
    ) {
        return this.chaptersService.createBlock(id, createBlockDto, req.user.id);
    }

    @Patch(':id/blocks/reorder')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.MENTOR, Role.ADMIN)
    async reorderBlocks(
        @Request() req: any,
        @Param('id') id: string,
        @Body(new ParseArrayPipe({ items: ReorderLessonBlockItemDto })) blocks: ReorderLessonBlockItemDto[]
    ) {
        // Map snake_case to service expectation if needed, but DTO uses matching structure
        // Service expects { id: string; order_index: number }[] which matches ReorderLessonBlockItemDto structure
        return this.chaptersService.reorderBlocks(id, blocks, req.user.id);
    }

    @Delete(':id/blocks/:blockId')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.MENTOR, Role.ADMIN)
    async deleteBlock(
        @Request() req: any,
        @Param('id') id: string,
        @Param('blockId') blockId: string
    ) {
        return this.chaptersService.deleteBlock(id, blockId, req.user.id);
    }

    @Patch(':id/blocks/:blockId')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.MENTOR, Role.ADMIN)
    async updateBlock(
        @Request() req: any,
        @Param('id') id: string,
        @Param('blockId') blockId: string,
        @Body() body: { content: string }
    ) {
        return this.chaptersService.updateBlock(id, blockId, body, req.user.id);
    }
    @Post('upload-signature')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.MENTOR, Role.ADMIN)
    async getUploadSignature(@Body() body: { folder: string }) {
        return this.chaptersService.getUploadSignature(body.folder);
    }
}
