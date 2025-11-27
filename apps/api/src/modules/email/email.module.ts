import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PdfGeneratorService } from '../tickets/pdf-generator.service';

@Module({
    imports: [PrismaModule],
    providers: [EmailService, PdfGeneratorService],
    exports: [EmailService],
})
export class EmailModule { }
