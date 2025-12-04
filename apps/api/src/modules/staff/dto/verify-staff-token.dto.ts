import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyStaffTokenDto {
    @IsString()
    @IsNotEmpty()
    token!: string;
}
