import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { UsersService } from './src/modules/users/users.service';
import { Role } from './src/entities/user.entity';

import * as dns from 'dns';

async function bootstrap() {
    dns.setServers(['8.8.8.8', '1.1.1.1']); // Fix DNS for Neon
    const app = await NestFactory.createApplicationContext(AppModule);
    const usersService = app.get(UsersService);

    const admins = [
        { email: 'sanjaykumardupati6@gmail.com', password: 'CodeDabba126', name: 'Sanjay Kumar' },
        { email: 'sneha.amballa0804@gmail.com', password: 'CodeDabba126', name: 'Sneha Amballa' },
    ];

    for (const admin of admins) {
        const existing = await usersService.findByEmail(admin.email);
        if (existing) {
            console.log(`User ${admin.email} already exists.`);
            // Optionally update role if needed
            if (existing.role !== Role.ADMIN) {
                await usersService.updateRole(existing.id, Role.ADMIN);
                console.log(`Updated role for ${admin.email} to ADMIN.`);
            }
        } else {
            await usersService.createUser({
                email: admin.email,
                password: admin.password,
                role: Role.ADMIN,
                name: admin.name,
                mobileNumber: '0000000000', // Placeholder
                location: 'Headquarters',
            });
            console.log(`Created admin ${admin.email}.`);
        }
    }

    await app.close();
}

bootstrap();
