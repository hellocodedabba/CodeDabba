import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../modules/users/users.service';
import { Role } from '../entities/user.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const usersService = app.get(UsersService);

    const adminEmail = 'admin@codedabba.com';
    const existingAdmin = await usersService.findByEmail(adminEmail);

    if (!existingAdmin) {
        console.log('Seeding Super Admin...');
        await usersService.createUser({
            email: adminEmail,
            password: 'SuperSecretPassword123!',
            role: Role.ADMIN,
            name: 'Super Admin',
        });
        console.log('Super Admin created successfully.');
    } else {
        console.log('Super Admin already exists.');
    }

    await app.close();
}

bootstrap();
