import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PdfGeneratorService } from './pdf-generator.service';
import { StaffModule } from '../staff/staff.module';
import { StaffAuthGuard } from '../staff/guards/staff-auth.guard';
import { RateLimitService } from '../../common/services/rate-limit.service';

@Module({
    imports: [PrismaModule, StaffModule],
    controllers: [TicketsController],
    providers: [TicketsService, PdfGeneratorService, StaffAuthGuard, RateLimitService],
    exports: [TicketsService],
})
export class TicketModule { }
