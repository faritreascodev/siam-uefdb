import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto, UpdateApplicationDto } from './dto/create-application.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApplicationStatus } from '@prisma/client';

@Controller('applications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  // === ENDPOINTS PARA APODERADO ===

  // Crear nueva solicitud (borrador vacío)
  @Post()
  create(@Request() req: any) {
    return this.applicationsService.create(req.user.id);
  }

  // Actualizar borrador (autoguardado)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateApplicationDto: UpdateApplicationDto,
    @Request() req: any,
  ) {
    return this.applicationsService.update(id, req.user.id, updateApplicationDto);
  }

  // Enviar solicitud
  @Post(':id/submit')
  submit(@Param('id') id: string, @Request() req: any) {
    return this.applicationsService.submit(id, req.user.id);
  }

  // Listar mis solicitudes
  @Get('my-applications')
  findMyApplications(@Request() req: any) {
    return this.applicationsService.findMyApplications(req.user.id);
  }

  // Obtener mis estadísticas
  @Get('my-stats')
  getMyStats(@Request() req: any) {
    return this.applicationsService.getMyStats(req.user.id);
  }

  // Verificar disponibilidad de cupos
  @Get('check-quota')
  checkQuota(
    @Query('gradeLevel') gradeLevel: string,
    @Query('shift') shift: string,
  ) {
    return this.applicationsService.checkQuota(gradeLevel, shift);
  }


  // Ver detalle de mi solicitud
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.applicationsService.findOne(id, req.user.id);
  }

  // Eliminar mi solicitud (solo DRAFT)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.applicationsService.remove(id, req.user.id);
  }

  // === ENDPOINTS PARA ADMIN ===

  // Estadísticas globales
  @Get('admin/stats')
  @Roles('admin', 'superadmin', 'secretary', 'principal', 'directivo')
  getGlobalStats() {
    return this.applicationsService.getGlobalStats();
  }

  // Listar todas las solicitudes con filtros
  @Get('admin/all')
  @Roles('admin', 'superadmin', 'secretary', 'principal', 'directivo')
  findAll(
    @Query('status') status?: ApplicationStatus,
    @Query('gradeLevel') gradeLevel?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('specialty') specialty?: string,
    @Query('shift') shift?: any,
    @Query('assignedToId') assignedToId?: string,
    @Query('processedById') processedById?: string,
    @Query('assignedParallel') assignedParallel?: string,
  ) {
    return this.applicationsService.findAll({
      status,
      gradeLevel,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      startDate,
      endDate,
      specialty,
      shift,
      assignedToId,
      processedById,
      assignedParallel,
    });
  }

  // Ver detalle de cualquier solicitud
  @Get('admin/:id')
  @Roles('admin', 'superadmin', 'secretary', 'principal', 'directivo')
  findOneAdmin(@Param('id') id: string) {
    return this.applicationsService.findOne(id);
  }

  // Poner en revisión
  @Post('admin/:id/review')
  @Roles('superadmin', 'secretary', 'principal', 'directivo')
  setUnderReview(@Param('id') id: string) {
    return this.applicationsService.setUnderReview(id);
  }

  // Solicitar correcciones
  @Post('admin/:id/request-correction')
  @Roles('superadmin', 'secretary', 'principal', 'directivo')
  requestCorrection(
    @Param('id') id: string,
    @Body('correctionRequest') correctionRequest: string,
  ) {
    return this.applicationsService.requestCorrection(id, correctionRequest);
  }

  // Aprobar solicitud
  @Post('admin/:id/approve')
  @Roles('superadmin', 'secretary', 'principal', 'directivo')
  approve(
    @Param('id') id: string,
    @Body('adminNotes') adminNotes?: string,
  ) {
    return this.applicationsService.approve(id, adminNotes);
  }

  // Rechazar solicitud
  @Post('admin/:id/reject')
  @Roles('superadmin', 'secretary', 'principal', 'directivo')
  reject(
    @Param('id') id: string,
    @Body('rejectionReason') rejectionReason: string,
  ) {
    return this.applicationsService.reject(id, rejectionReason);
  }

  // Asignar a directivo
  @Post('admin/:id/assign')
  @Roles('admin', 'superadmin', 'secretary', 'principal', 'directivo')
  assignToDirectivo(
    @Param('id') id: string,
    @Body('directivoId') directivoId: string,
    @Request() req: any,
  ) {
    return this.applicationsService.assignToDirectivo(id, directivoId, req.user.id);
  }

  // Agregar comentario interno
  @Post('admin/:id/comment')
  @Roles('admin', 'superadmin', 'secretary', 'principal', 'directivo')
  addInternalComment(
    @Param('id') id: string,
    @Body('comment') comment: string,
    @Request() req: any,
  ) {
    return this.applicationsService.addInternalComment(id, comment, req.user);
  }

  // Solicitudes asignadas a mí (para directivos)
  @Get('directivo/assigned')
  @Roles('admin', 'superadmin', 'directivo', 'principal')
  getAssignedToMe(
    @Request() req: any,
    @Query('status') status?: ApplicationStatus,
    @Query('gradeLevel') gradeLevel?: string,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('specialty') specialty?: string,
    @Query('shift') shift?: any,
  ) {
    return this.applicationsService.getAssignedTo(req.user.id, {
      status,
      gradeLevel,
      search,
      startDate,
      endDate,
      specialty,
      shift,
    });
  }

  // Exportar admitidos CSV
  @Get('admin/export/admitted-csv')
  @Roles('admin', 'superadmin', 'secretary', 'principal', 'directivo')
  async exportAdmittedCsv(@Request() res: any) {
    const csv = await this.applicationsService.exportAdmittedCsv();
    return { csv };
  }

  // === ASIGNACIÓN DE PARALELOS (Módulo 2.9) ===

  @Get('admin/:id/available-parallels')
  @Roles('admin', 'superadmin', 'secretary', 'principal', 'directivo')
  getAvailableParallels(@Param('id') id: string) {
    return this.applicationsService.getAvailableParallels(id);
  }

  @Post('admin/:id/assign-parallel')
  @Roles('admin', 'superadmin', 'secretary', 'principal', 'directivo')
  assignParallel(
    @Param('id') id: string,
    @Body('parallel') parallel: string,
    @Request() req: any,
  ) {
    return this.applicationsService.assignParallel(id, parallel, req.user.id);
  }

  // === GESTIÓN DE CURSILLOS ===
  
  @Post('admin/:id/cursillo-schedule')
  @Roles('admin', 'superadmin', 'secretary', 'principal', 'directivo')
  scheduleCursillo(
    @Param('id') id: string,
    @Body('cursilloDate') cursilloDate: string,
  ) {
    return this.applicationsService.scheduleCursillo(id, cursilloDate);
  }

  @Post('admin/:id/cursillo-result')
  @Roles('admin', 'superadmin', 'secretary', 'principal', 'directivo')
  recordCursilloResult(
    @Param('id') id: string,
    @Body('result') result: 'APPROVED' | 'REJECTED',
    @Body('notes') notes?: string,
  ) {
    return this.applicationsService.recordCursilloResult(id, result, notes);
  }
}
