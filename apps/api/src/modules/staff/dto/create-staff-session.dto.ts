import { IsUUID, IsInt, Min, Max, IsOptional } from 'class-validator';

export class CreateStaffSessionDto {
    @IsUUID('4')
    eventId!: string;

    /**
     * Expiración en horas (1-72). Por defecto 12h.
     */
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(72)
    expiresInHours?: number;
}
