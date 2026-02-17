
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Otp, OtpType } from '../../entities/otp.entity';
import { MailerService } from '@nestjs-modules/mailer';
import { MoreThan, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class OtpService {
    private readonly logger = new Logger(OtpService.name);

    constructor(
        @InjectRepository(Otp)
        private otpRepository: Repository<Otp>,
        private readonly mailerService: MailerService,
    ) { }

    @Cron(CronExpression.EVERY_MINUTE)
    async handleCron() {
        this.logger.debug('Running OTP cleanup task...');
        try {
            const result = await this.otpRepository
                .createQueryBuilder()
                .delete()
                .from(Otp)
                .where("createdAt < NOW() - INTERVAL '10 minutes'")
                .execute();

            if (result.affected && result.affected > 0) {
                this.logger.debug(`Deleted ${result.affected} expired OTPs.`);
            }
        } catch (error) {
            this.logger.error('Failed to delete expired OTPs', error);
        }
    }

    async generateAndSendOtp(email: string, type: OtpType) {
        // Generate 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date();
        expiry.setMinutes(expiry.getMinutes() + 10); // 10 minutes expiry

        // Invalidate previous OTPs for this email and type
        await this.otpRepository.update({ email, type, isUsed: false }, { isUsed: true });

        const otp = this.otpRepository.create({
            email,
            otp: otpCode,
            type,
            expiry,
            isUsed: false,
        });

        await this.otpRepository.save(otp);

        // Send Email
        await this.sendOtpEmail(email, otpCode, type);

        return { message: 'OTP sent successfully' };
    }

    async verifyOtp(email: string, otpCode: string, type: OtpType): Promise<boolean> {
        const otpRecord = await this.otpRepository.findOne({
            where: {
                email,
                otp: otpCode,
                type,
                isUsed: false,
                expiry: MoreThan(new Date()),
            },
        });

        if (!otpRecord) {
            throw new BadRequestException('Invalid or expired OTP');
        }

        // Mark OTP as used
        otpRecord.isUsed = true;
        await this.otpRepository.save(otpRecord);

        return true;
    }

    private async sendOtpEmail(email: string, otp: string, type: string) {
        console.log(`[DEV ONLY] Generated OTP for ${email}: ${otp}`); // For debugging/dev without email setup
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: `${type} Verification OTP - CodeDabba`,
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px;">
                        <h2>CodeDabba Verification</h2>
                        <p>Your OTP for ${type.toLowerCase().replace('_', ' ')} is:</p>
                        <h1 style="color: #4F46E5; letter-spacing: 5px;">${otp}</h1>
                        <p>This OTP is valid for 10 minutes.</p>
                        <p>If you did not request this, please ignore this email.</p>
                    </div>
                `,
            });
        } catch (error) {
            console.error('Error sending OTP email:', error);
            // In a real app we might throw, but for dev if email config is wrong we might want to let it pass if we see the log.
            // However, the user asked for a flow where backend generates OTP.
            // If we throw here, the frontend gets 400.
            // Let's throw for now to force correct config, but user might be stuck if they didn't add env vars.
            // throw new BadRequestException('Failed to send OTP email');
            // EDIT: Retrowing to ensure user knows email failed.
            throw new BadRequestException(`Failed to send OTP email: ${error.message}`);
        }
    }
}
