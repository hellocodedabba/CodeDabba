import * as dotenv from 'dotenv';
dotenv.config();

// Trigger backend restart to load latest .env (reloaded for port update)
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import * as dns from 'dns';

// Validate critical environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ CRITICAL: Missing required environment variables:', missingEnvVars);
  console.error('Please set the following environment variables before starting the application:');
  missingEnvVars.forEach(envVar => console.error(`  - ${envVar}`));
  process.exit(1);
}

console.log('✓ Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT ?? 3000,
  DATABASE_URL: process.env.DATABASE_URL ? '***' : 'NOT SET',
  JWT_SECRET: process.env.JWT_SECRET ? '***' : 'NOT SET',
});

async function bootstrap() {
  dns.setServers(['8.8.8.8', '1.1.1.1']); // Force Node.js to use Google/Cloudflare DNS

  try {
    const app = await NestFactory.create(AppModule);

    const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
      ? process.env.CORS_ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
      : ['http://localhost:3000', 'http://localhost:3001', 'https://code-dabba.vercel.app'];

    app.enableCors({
      origin: allowedOrigins,
      credentials: true,
    });
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ transform: true }));

    const port = process.env.PORT || 3000;
    await app.listen(port, '0.0.0.0');
    console.log(`✓ Application started successfully on port ${port}`);
  } catch (error) {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap();
