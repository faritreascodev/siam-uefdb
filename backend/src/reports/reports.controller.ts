import { Controller, Get, Param, Res, UseGuards, NotFoundException, ForbiddenException, Req } from '@nestjs/common';
import { Response } from 'express';
import { PdfService } from './services/pdf.service';
import { ApplicationsService } from '../applications/applications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(
    private pdfService: PdfService,
    private applicationsService: ApplicationsService,
    private reportsService: ReportsService
  ) {}

  @Get('stats/dashboard')
  @Roles('admin', 'directivo')
  async getDashboardStats() {
    return this.reportsService.getDashboardStats();
  }

  @Get('stats/levels')
  @Roles('admin', 'directivo')
  async getStatsByLevel() {
    return this.reportsService.getStatsByLevel();
  }

  @Get('application/:id/pdf')
  @Roles('admin', 'secretary', 'directivo', 'user')
  async downloadApplicationPdf(
    @Param('id') id: string,
    @Res() res: Response,
    @Req() req: any
  ) {
    const userId = req.user.id;
    const userRoles = req.user.roles || [];

    // Fetch application directly from Prisma via service (we might need a method that doesn't check owner if admin)
    // For now, let's use findOne and handle permissions manually or reuse existing service methods
    // If user is admin/secretary/directivo, access is allowed. If 'user', must be owner.
    
    let application;
    try {
        const hasPrivilegedRole = userRoles.some(role => ['admin', 'secretary', 'directivo'].includes(role));

        if (hasPrivilegedRole) {
             application = await this.applicationsService.findOne(id);
        } else {
             application = await this.applicationsService.findOne(id, userId);
        }
    } catch (e) {
        throw e;
    }

    const buffer = await this.pdfService.generateApplicationPdf(application);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=application-${application.studentCedula}.pdf`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}
