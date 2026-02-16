
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { OtpService } from './otp.service';
import { SendOtpDto, VerifyOtpDto } from './dto/otp.dto';

@Controller('otp')
export class OtpController {
    constructor(private readonly otpService: OtpService) { }

    @Post('send')
    @HttpCode(HttpStatus.OK)
    async sendOtp(@Body() sendOtpDto: SendOtpDto) {
        return this.otpService.generateAndSendOtp(sendOtpDto.email, sendOtpDto.type);
    }

    @Post('verify')
    @HttpCode(HttpStatus.OK)
    async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
        const isValid = await this.otpService.verifyOtp(verifyOtpDto.email, verifyOtpDto.otp, verifyOtpDto.type);
        return { valid: isValid, message: 'OTP verified successfully' };
    }
}
