import { Module } from '@nestjs/common';
import { PdfGeneratorService } from './pdf-generator.service';
import { ComplimentaryTicketsService } from './complimentary-tickets.service';
import { TicketsController } from './tickets.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [TicketsController],
    providers: [PdfGeneratorService, ComplimentaryTicketsService],
    exports: [PdfGeneratorService, ComplimentaryTicketsService],
})
export class TicketsModule { }
