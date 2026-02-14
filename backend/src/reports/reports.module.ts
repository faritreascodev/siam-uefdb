import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { PdfService } from './services/pdf.service';
import { ApplicationsModule } from '../applications/applications.module';
import { ReportsService } from './reports.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ApplicationsModule, PrismaModule],
  controllers: [ReportsController],
  providers: [PdfService, ReportsService],
  exports: [PdfService],
})
export class ReportsModule {}
