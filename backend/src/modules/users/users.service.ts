import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async createUser(createUserDto: CreateUserDto): Promise<User> {
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        const user = this.usersRepository.create({
            ...createUserDto,
            password: hashedPassword,
        });
        return this.usersRepository.save(user);
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { email } });
    }

    async findById(id: string): Promise<User> {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async updateRole(id: string, role: string): Promise<User> {
        const user = await this.findById(id);
        user.role = role as any;
        return this.usersRepository.save(user); // Fixed: Save the entity instance, not just the ID
    }
    async createFromGoogle(data: { email: string; name: string; googleId: string; picture?: string }): Promise<User> {
        const user = this.usersRepository.create({
            email: data.email,
            name: data.name,
            googleId: data.googleId,
            password: null, // Explicitly null for Google users
            // role: 'STUDENT', // Default is handled by entity default
        });
        return this.usersRepository.save(user);
    }

    async updateGoogleId(id: string, googleId: string): Promise<User> {
        const user = await this.findById(id);
        user.googleId = googleId;
        return this.usersRepository.save(user);
    }

    async updatePassword(id: string, password: string): Promise<User> {
        const user = await this.findById(id);
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        return this.usersRepository.save(user);
    }
}
