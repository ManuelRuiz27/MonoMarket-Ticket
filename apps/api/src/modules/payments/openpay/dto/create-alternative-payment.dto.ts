import { IsString, IsNumber, IsEmail, IsOptional, IsIn } from 'class-validator';

/**
 * DTO para crear cargos SPEI (transferencia bancaria)
 */
export class CreateSpeiChargeDto {
    @IsString()
    orderId!: string;

    @IsNumber()
    amount!: number;

    @IsString()
    @IsIn(['MXN'])
    currency!: string;

    @IsString()
    description!: string;

    @IsString()
    customerName!: string;

    @IsEmail()
    customerEmail!: string;

    @IsOptional()
    @IsString()
    customerPhone?: string;
}

/**
 * DTO para crear cargos OXXO (tienda de conveniencia)
 */
export class CreateOxxoChargeDto {
    @IsString()
    orderId!: string;

    @IsNumber()
    amount!: number;

    @IsString()
    @IsIn(['MXN'])
    currency!: string;

    @IsString()
    description!: string;

    @IsString()
    customerName!: string;

    @IsEmail()
    customerEmail!: string;

    @IsOptional()
    @IsNumber()
    daysToExpire?: number; // Default: 3 días
}
