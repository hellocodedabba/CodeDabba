import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async createUser(createUserDto: CreateUserDto) {
        return this.prisma.user.create({
            data: createUserDto,
        });
    }

    async findAll() {
        return this.prisma.user.findMany({
            where: {
                deletedAt: null,
            },
        });
    }

    async findById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });

        if (!user || user.deletedAt) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        return user;
    }

    async softDelete(id: string) {
        // Check if user exists first
        await this.findById(id);

        return this.prisma.user.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                isActive: false,
            },
        });
    }
}
