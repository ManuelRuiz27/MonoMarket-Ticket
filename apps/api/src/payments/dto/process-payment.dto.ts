import { Type } from 'class-transformer';
import { IsEmail, IsIn, IsInt, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';

export type PaymentProvider = 'mercadopago';
export type PaymentMethod = 'card' | 'google_pay' | 'apple_pay' | 'spei' | 'oxxo';

class PaymentPayerDto {
    @IsOptional()
    @IsString()
    firstName?: string;

    @IsOptional()
    @IsString()
    lastName?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    identificationType?: string;

    @IsOptional()
    @IsString()
    identificationNumber?: string;
}

export class ProcessPaymentDto {
    @IsUUID('4')
    orderId!: string;

    @IsIn(['mercadopago'])
    provider!: PaymentProvider;

    @IsIn(['card', 'google_pay', 'apple_pay', 'spei', 'oxxo'])
    method!: PaymentMethod;

    @IsString()
    token!: string;

    @IsOptional()
    @IsString()
    issuerId?: string;

    @IsOptional()
    @IsString()
    paymentMethodId?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    installments?: number;

    @IsOptional()
    @ValidateNested()
    @Type(() => PaymentPayerDto)
    payer?: PaymentPayerDto;
}
