
import { IsEmail, IsNotEmpty, IsEnum } from 'class-validator';
import { OtpType } from '../../../entities/otp.entity';

export class SendOtpDto {
    @IsEmail()
    email: string;

    @IsEnum(OtpType)
    type: OtpType;
}

export class VerifyOtpDto {
    @IsEmail()
    email: string;

    @IsNotEmpty()
    otp: string;

    @IsEnum(OtpType)
    type: OtpType;
}
