import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { CursilloService } from './cursillo.service';
import {
    CreateCursilloSessionDto,
    UpdateCursilloSessionDto,
    UpdateEnrollmentDto,
} from './dto/cursillo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('cursillos')
@ApiBearerAuth('JWT-auth')
@Controller('cursillos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CursilloController {
    constructor(private readonly cursilloService: CursilloService) { }

    // ============ ESTADÍSTICAS ============

    @Get('stats')
    @Roles('admin', 'superadmin', 'secretary', 'principal')
    @ApiOperation({ summary: 'Estadísticas globales del cursillo' })
    getStats(@Query('academicYear') academicYear?: string) {
        return this.cursilloService.getStats(academicYear);
    }

    // ============ SESIONES ============

    @Get('sessions')
    @Roles('admin', 'superadmin', 'secretary', 'principal')
    @ApiOperation({ summary: 'Listar todas las sesiones del cursillo' })
    getAllSessions(@Query('academicYear') academicYear?: string) {
        return this.cursilloService.getAllSessions(academicYear);
    }

    @Get('sessions/:id')
    @Roles('admin', 'superadmin', 'secretary', 'principal')
    @ApiOperation({ summary: 'Ver detalle de una sesión del cursillo' })
    getSession(@Param('id') id: string) {
        return this.cursilloService.getSession(id);
    }

    @Post('sessions')
    @Roles('admin', 'superadmin', 'secretary', 'principal')
    @ApiOperation({ summary: 'Crear nueva sesión de cursillo' })
    createSession(@Body() dto: CreateCursilloSessionDto) {
        return this.cursilloService.createSession(dto);
    }

    @Patch('sessions/:id')
    @Roles('admin', 'superadmin', 'secretary', 'principal')
    @ApiOperation({ summary: 'Actualizar sesión de cursillo' })
    updateSession(@Param('id') id: string, @Body() dto: UpdateCursilloSessionDto) {
        return this.cursilloService.updateSession(id, dto);
    }

    // ============ INSCRIPCIONES ============

    /**
     * Inscribir a un estudiante en las materias que le corresponden según grado/especialidad.
     */
    @Post('applications/:applicationId/enroll')
    @Roles('admin', 'superadmin', 'secretary', 'principal')
    @ApiOperation({ summary: 'Inscribir solicitud en el cursillo' })
    enrollApplication(
        @Param('applicationId') applicationId: string,
        @Query('academicYear') academicYear?: string,
    ) {
        return this.cursilloService.enrollApplicationInAllSubjects(applicationId, academicYear);
    }

    /**
     * Ver inscripciones de una solicitud — solo para personal administrativo.
     */
    @Get('applications/:applicationId/enrollments')
    @Roles('admin', 'superadmin', 'secretary', 'principal')
    @ApiOperation({ summary: 'Ver inscripciones de cursillo de una solicitud (admin)' })
    getApplicationEnrollments(@Param('applicationId') applicationId: string) {
        return this.cursilloService.getApplicationEnrollments(applicationId);
    }

    /**
     * El apoderado consulta las inscripciones de su PROPIA solicitud.
     * La validación de propiedad se realiza en el service.
     */
    @Get('applications/:applicationId/my-enrollments')
    @Roles('apoderado', 'admin', 'superadmin', 'secretary', 'principal')
    @ApiOperation({ summary: 'Ver inscripciones del cursillo de una solicitud propia (apoderado)' })
    @ApiResponse({ status: 200, description: 'Lista de inscripciones' })
    @ApiResponse({ status: 403, description: 'No autorizado — la solicitud no le pertenece' })
    getMyApplicationEnrollments(
        @Param('applicationId') applicationId: string,
        @Request() req: any,
    ) {
        return this.cursilloService.getApplicationEnrollmentsForOwner(
            applicationId,
            req.user.id,
            req.user.roles,
        );
    }

    /**
     * Actualizar asistencia y nota de una inscripción
     */
    @Patch('enrollments/:enrollmentId')
    @Roles('admin', 'superadmin', 'secretary', 'principal')
    @ApiOperation({ summary: 'Actualizar asistencia y nota de una inscripción' })
    updateEnrollment(
        @Param('enrollmentId') enrollmentId: string,
        @Body() dto: UpdateEnrollmentDto,
    ) {
        return this.cursilloService.updateEnrollment(enrollmentId, dto);
    }

    /**
     * Calcular y registrar el resultado final del cursillo.
     */
    @Post('applications/:applicationId/finalize')
    @Roles('admin', 'superadmin', 'secretary', 'principal')
    @ApiOperation({ summary: 'Finalizar cursillo y calcular resultado' })
    finalizeCursillo(@Param('applicationId') applicationId: string) {
        return this.cursilloService.computeAndSetFinalResult(applicationId);
    }

    /**
     * Eliminar solicitud reprobada y liberar el cupo.
     */
    @Delete('applications/:applicationId')
    @Roles('admin', 'superadmin', 'secretary', 'principal')
    @ApiOperation({ summary: 'Eliminar solicitud reprobada y liberar cupo' })
    removeApplication(
        @Param('applicationId') applicationId: string,
        @Request() req: any,
    ) {
        return this.cursilloService.removeApplication(applicationId, req.user.id);
    }
}
