
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OtpService } from './otp.service';
import { Otp } from '../../entities/otp.entity';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OtpController } from './otp.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([Otp]),
        MailerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                transport: {
                    host: configService.get('MAIL_HOST'), // e.g., smtp.gmail.com
                    port: 587,
                    secure: false, // true for 465, false for other ports
                    auth: {
                        user: configService.get('MAIL_USER'),
                        pass: configService.get('MAIL_PASSWORD'),
                    },
                },
                defaults: {
                    from: `"CodeDabba" <${configService.get('MAIL_FROM')}>`,
                },
            }),
        }),
    ],
    controllers: [OtpController],
    providers: [OtpService],
    exports: [OtpService],
})
export class OtpModule { }
