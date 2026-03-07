import { Controller, Get, Param, Res, UseGuards, Req, Query } from '@nestjs/common';
import { Response } from 'express';
import { PdfService } from './services/pdf.service';
import { ApplicationsService } from '../applications/applications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ModuleAccessGuard } from '../auth/guards/module-access.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ModuleAccess } from '../auth/decorators/module-access.decorator';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard, ModuleAccessGuard)
@ModuleAccess('reportes')
export class ReportsController {
  constructor(
    private pdfService: PdfService,
    private applicationsService: ApplicationsService,
    private reportsService: ReportsService
  ) { }

  @Get('stats/dashboard')
  @Roles('admin', 'rector', 'secretaria', 'superadmin')
  @ModuleAccess('dashboard')
  async getDashboardStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getDashboardStats(startDate, endDate);
  }

  @Get('daily-summary')
  @Roles('admin', 'rector', 'secretaria', 'superadmin', 'directivo')
  getDailySummary() {
    return this.reportsService.getDailySummary();
  }

  @Get('stats/levels')
  @Roles('admin', 'rector', 'secretaria', 'superadmin')
  @ModuleAccess('dashboard')
  async getStatsByLevel() {
    return this.reportsService.getStatsByLevel();
  }

  @Get('application/:id/pdf')
  @Roles('admin', 'secretaria', 'rector', 'superadmin', 'apoderado')
  @ModuleAccess('')
  async downloadApplicationPdf(
    @Param('id') id: string,
    @Res() res: Response,
    @Req() req: any
  ) {
    const userId = req.user.id;
    const userRoles = req.user.roles || [];

    let application;
    try {
      const hasPrivilegedRole = userRoles.some(role => ['admin', 'secretaria', 'rector', 'superadmin'].includes(role));

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
