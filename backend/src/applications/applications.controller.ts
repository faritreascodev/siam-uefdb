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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto, UpdateApplicationDto } from './dto/create-application.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ModuleAccessGuard } from '../auth/guards/module-access.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ModuleAccess } from '../auth/decorators/module-access.decorator';
import { ApplicationStatus } from '@prisma/client';

@ApiTags('applications')
@Controller('applications')
@UseGuards(JwtAuthGuard, RolesGuard, ModuleAccessGuard)
@ModuleAccess('admisiones')
@ApiBearerAuth('JWT-auth')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) { }

  // === ENDPOINTS PARA APODERADO ===

  // Crear nueva solicitud (borrador vacío)
  @Post()
  @ModuleAccess('')
  @ApiOperation({ summary: 'Crear una nueva solicitud de admisión (borrador)' })
  create(@Request() req: any) {
    return this.applicationsService.create(req.user.id);
  }

  // Actualizar borrador (autoguardado)
  @Patch(':id')
  @ModuleAccess('')
  update(
    @Param('id') id: string,
    @Body() updateApplicationDto: UpdateApplicationDto,
    @Request() req: any,
  ) {
    return this.applicationsService.update(id, req.user.id, updateApplicationDto);
  }

  // Enviar solicitud
  @Post(':id/submit')
  @ModuleAccess('')
  submit(@Param('id') id: string, @Request() req: any) {
    return this.applicationsService.submit(id, req.user.id);
  }

  // Listar mis solicitudes
  @Get('my-applications')
  @ModuleAccess('')
  findMyApplications(@Request() req: any) {
    return this.applicationsService.findMyApplications(req.user.id);
  }

  // Obtener mis estadísticas
  @Get('my-stats')
  @ModuleAccess('')
  getMyStats(@Request() req: any) {
    return this.applicationsService.getMyStats(req.user.id);
  }

  // Verificar disponibilidad de cupos
  @Get('check-quota')
  @ModuleAccess('')
  @ApiOperation({ summary: 'Verificar disponibilidad de cupos por nivel y jornada' })
  checkQuota(
    @Query('gradeLevel') gradeLevel: string,
    @Query('shift') shift: string,
    @Query('previousSchool') previousSchool?: string
  ) {
    return this.applicationsService.checkQuota(gradeLevel, shift, previousSchool);
  }

  // Buscar estudiante por cédula (para autocompletado/continuidad)
  @Get('search-cedula/:cedula')
  @ModuleAccess('')
  @ApiOperation({ summary: 'Buscar datos históricos de un estudiante por cédula (Autocompletado)' })
  searchCedula(@Param('cedula') cedula: string) {
    return this.applicationsService.searchByCedula(cedula);
  }


  // Ver detalle de mi solicitud
  @Get(':id')
  @ModuleAccess('')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.applicationsService.findOne(id, req.user.id);
  }

  // Eliminar mi solicitud (solo DRAFT)
  @Delete(':id')
  @ModuleAccess('')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.applicationsService.remove(id, req.user.id);
  }

  // Cargar detalles de pago
  @Patch(':id/payment')
  @ModuleAccess('')
  uploadPaymentDetails(
    @Param('id') id: string,
    @Body('paymentDate') paymentDate: string,
    @Body('paymentReference') paymentReference: string,
    @Request() req: any,
  ) {
    return this.applicationsService.uploadPaymentDetails(id, req.user.id, paymentDate, paymentReference);
  }

  // === ENDPOINTS PARA ADMIN ===

  // Estadísticas globales
  @Get('admin/stats')
  @Roles('admin', 'superadmin', 'secretaria', 'rector')
  getGlobalStats() {
    return this.applicationsService.getGlobalStats();
  }

  // Listar todas las solicitudes con filtros
  @Get('admin/all')
  @Roles('admin', 'superadmin', 'secretaria', 'rector')
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
  @Roles('admin', 'superadmin', 'secretaria', 'rector')
  findOneAdmin(@Param('id') id: string) {
    return this.applicationsService.findOne(id);
  }

  // Volcado anual de datos
  @Post('admin/bulk/rollover')
  @Roles('admin', 'superadmin', 'rector')
  @ApiOperation({ summary: 'Ejecutar volcado anual (Rollover) de estudiantes matriculados a historial académico' })
  async executeRollover() {
    return this.applicationsService.executeRollover();
  }

  // Poner en revisión
  @Post('admin/:id/review')
  @Roles('admin', 'superadmin', 'secretaria', 'rector')
  setUnderReview(@Param('id') id: string) {
    return this.applicationsService.setUnderReview(id);
  }

  // Solicitar correcciones
  @Post('admin/:id/request-correction')
  @Roles('admin', 'superadmin', 'secretaria', 'rector')
  requestCorrection(
    @Param('id') id: string,
    @Body('correctionRequest') correctionRequest: string,
  ) {
    return this.applicationsService.requestCorrection(id, correctionRequest);
  }

  // Aprobar solicitud
  @Post('admin/:id/approve')
  @Roles('admin', 'superadmin', 'secretaria', 'rector')
  approve(
    @Param('id') id: string,
    @Body('adminNotes') adminNotes?: string,
  ) {
    return this.applicationsService.approve(id, adminNotes);
  }

  // Rechazar solicitud
  @Post('admin/:id/reject')
  @Roles('admin', 'superadmin', 'secretaria', 'rector')
  reject(
    @Param('id') id: string,
    @Body('rejectionReason') rejectionReason: string,
  ) {
    return this.applicationsService.reject(id, rejectionReason);
  }

  @Post('admin/bulk/approve')
  @Roles('admin', 'superadmin', 'secretaria', 'rector')
  bulkApprove(@Body('ids') ids: string[], @Request() req: any) {
    return this.applicationsService.bulkApprove(ids, req.user);
  }

  @Post('admin/bulk/reject')
  @Roles('admin', 'superadmin', 'secretaria', 'rector')
  bulkReject(@Body('ids') ids: string[], @Body('reason') reason: string, @Request() req: any) {
    return this.applicationsService.bulkReject(ids, reason, req.user);
  }

  // Asignar a directivo
  @Post('admin/:id/assign')
  @Roles('admin', 'superadmin', 'secretaria', 'rector')
  assignToDirectivo(
    @Param('id') id: string,
    @Body('directivoId') directivoId: string,
    @Request() req: any,
  ) {
    return this.applicationsService.assignToDirectivo(id, directivoId, req.user.id);
  }

  // Agregar comentario interno
  @Post('admin/:id/comment')
  @Roles('admin', 'superadmin', 'secretaria', 'rector')
  addInternalComment(
    @Param('id') id: string,
    @Body('comment') comment: string,
    @Request() req: any,
  ) {
    return this.applicationsService.addInternalComment(id, comment, req.user);
  }

  // Solicitudes asignadas a mí (para directivos)
  @Get('directivo/assigned')
  @Roles('admin', 'superadmin', 'rector')
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
  @Roles('superadmin', 'admin', 'rector')
  async exportAdmittedCsv(@Request() res: any) {
    const csv = await this.applicationsService.exportAdmittedCsv();
    return { csv };
  }

  // === ASIGNACIÓN DE PARALELOS (Módulo 2.9) ===

  @Get('admin/:id/available-parallels')
  @Roles('superadmin', 'admin', 'secretaria', 'rector')
  @ModuleAccess('matriculacion')
  getAvailableParallels(@Param('id') id: string) {
    return this.applicationsService.getAvailableParallels(id);
  }

  @Post('admin/:id/assign-parallel')
  @Roles('admin', 'superadmin', 'secretaria', 'rector')
  @ModuleAccess('matriculacion')
  @ApiOperation({ summary: 'Asignar paralelo y finalizar matriculación' })
  assignParallel(
    @Param('id') id: string,
    @Body('parallel') parallel: string,
    @Request() req: any,
  ) {
    return this.applicationsService.assignParallel(id, parallel, req.user.id);
  }

  // === PAGOS ===

  @Post('admin/:id/validate-payment')
  @Roles('admin', 'superadmin', 'secretaria', 'rector')
  validatePayment(
    @Param('id') id: string,
    @Body('isValid') isValid: boolean,
    @Body('reason') reason?: string,
    @Request() req?: any,
  ) {
    return this.applicationsService.validatePayment(id, isValid, reason, req?.user?.id);
  }

  // === GESTIÓN DE CURSILLOS ===

  @Post('admin/:id/cursillo-schedule')
  @Roles('admin', 'superadmin', 'secretaria', 'rector')
  @ModuleAccess('cursillos')
  scheduleCursillo(
    @Param('id') id: string,
    @Body('cursilloDate') cursilloDate: string,
  ) {
    return this.applicationsService.scheduleCursillo(id, cursilloDate);
  }

  @Post('admin/:id/cursillo-result')
  @Roles('admin', 'superadmin', 'secretaria', 'rector')
  @ModuleAccess('cursillos')
  recordCursilloResult(
    @Param('id') id: string,
    @Body('result') result: 'APPROVED' | 'REJECTED',
    @Body('notes') notes?: string,
  ) {
    return this.applicationsService.recordCursilloResult(id, result, notes);
  }

  // Eliminar solicitud (admin) — libera cupo
  @Delete('admin/:id')
  @Roles('admin', 'superadmin', 'secretaria', 'rector')
  @ModuleAccess('admisiones')
  adminRemove(@Param('id') id: string, @Request() req: any) {
    return this.applicationsService.adminRemove(id, req.user.id);
  }
}


