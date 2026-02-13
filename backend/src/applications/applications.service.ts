import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApplicationDto, UpdateApplicationDto } from './dto/create-application.dto';
import { ApplicationStatus, Shift } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ApplicationsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService
  ) {}

  // Crear nueva solicitud (borrador)
  async create(userId: string) {
    return this.prisma.application.create({
      data: {
        userId,
        status: 'DRAFT',
      },
      include: {
        documents: true,
      },
    });
  }

  // Actualizar borrador (autoguardado)
  async update(id: string, userId: string, dto: UpdateApplicationDto) {
    const application = await this.findOneOrFail(id, userId);

    // Solo se puede editar en estado DRAFT o REQUIRES_CORRECTION
    if (!['DRAFT', 'REQUIRES_CORRECTION'].includes(application.status)) {
      throw new ForbiddenException('Solo se pueden editar solicitudes en borrador o que requieren corrección');
    }

    try {
      return await this.prisma.application.update({
        where: { id },
        data: {
          ...dto,
          studentBirthDate: dto.studentBirthDate ? new Date(dto.studentBirthDate) : undefined,
          studentBirthPlace: dto.studentBirthPlace ? JSON.parse(JSON.stringify(dto.studentBirthPlace)) : undefined,
          fatherData: dto.fatherData ? JSON.parse(JSON.stringify(dto.fatherData)) : undefined,
          motherData: dto.motherData ? JSON.parse(JSON.stringify(dto.motherData)) : undefined,
          representativeData: dto.representativeData ? JSON.parse(JSON.stringify(dto.representativeData)) : undefined,
        },
        include: {
          documents: true,
        },
      });
    } catch (error) {
      if (error.code === 'P2002' && error.meta?.target?.includes('studentCedula')) {
        throw new BadRequestException('Ya existe una solicitud registrada para este estudiante (Cédula duplicada).');
      }
      throw error;
    }
  }

  // Enviar solicitud (cambiar estado a SUBMITTED)
  async submit(id: string, userId: string) {
    const application = await this.findOneOrFail(id, userId);

    if (application.status !== 'DRAFT' && application.status !== 'REQUIRES_CORRECTION') {
      throw new BadRequestException('Solo se pueden enviar solicitudes en borrador o que requieren corrección');
    }

    // Validar campos requeridos
    this.validateRequiredFields(application);

    // Validar documentos requeridos
    await this.validateRequiredDocuments(id);

    const updatedApp = await this.prisma.application.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
      include: {
        documents: true,
      },
    });

    // Notify User
    await this.notificationsService.createForApplicationStatus(
      userId,
      id,
      `${application.studentFirstName} ${application.studentLastName}`,
      'APPLICATION_SUBMITTED'
    );

    return updatedApp;
  }

  // Listar solicitudes del usuario (apoderado)
  async findMyApplications(userId: string) {
    return this.prisma.application.findMany({
      where: { userId },
      include: {
        documents: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  // Obtener estadísticas del usuario
  async getMyStats(userId: string) {
    const applications = await this.prisma.application.findMany({
      where: { userId },
      select: { status: true },
    });

    return {
      total: applications.length,
      draft: applications.filter(a => a.status === 'DRAFT').length,
      submitted: applications.filter(a => ['SUBMITTED', 'UNDER_REVIEW'].includes(a.status)).length,
      requiresCorrection: applications.filter(a => a.status === 'REQUIRES_CORRECTION').length,
      approved: applications.filter(a => a.status === 'APPROVED').length,
      rejected: applications.filter(a => a.status === 'REJECTED').length,
    };
  }

  // Ver detalle de solicitud
  async findOne(id: string, userId?: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        documents: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    // Si se proporciona userId, verificar que sea el propietario
    if (userId && application.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para ver esta solicitud');
    }

    return application;
  }

  // Eliminar solicitud (solo DRAFT)
  async remove(id: string, userId: string) {
    const application = await this.findOneOrFail(id, userId);

    if (application.status !== 'DRAFT') {
      throw new ForbiddenException('Solo se pueden eliminar solicitudes en borrador');
    }

    return this.prisma.application.delete({
      where: { id },
    });
  }

  // === MÉTODOS PARA ADMIN ===

  // Estadísticas globales
  async getGlobalStats() {
    const applications = await this.prisma.application.findMany({
      select: { status: true },
    });

    return {
      total: applications.length,
      draft: applications.filter(a => a.status === 'DRAFT').length,
      submitted: applications.filter(a => a.status === 'SUBMITTED').length,
      underReview: applications.filter(a => a.status === 'UNDER_REVIEW').length,
      requiresCorrection: applications.filter(a => a.status === 'REQUIRES_CORRECTION').length,
      approved: applications.filter(a => a.status === 'APPROVED').length,
      rejected: applications.filter(a => a.status === 'REJECTED').length,
    };
  }

  // Listar todas las solicitudes (admin) con filtros y paginación
  async findAll(options?: {
    status?: ApplicationStatus;
    gradeLevel?: string;
    page?: number;
    limit?: number;
    search?: string;
  startDate?: string;
    endDate?: string;
    specialty?: string;
    shift?: Shift;
    assignedToId?: string;
    processedById?: string;
    assignedParallel?: string;
  }) {
    const { 
      status, gradeLevel, page = 1, limit = 20, 
      search, startDate, endDate, specialty, shift, assignedToId, processedById,
      assignedParallel
    } = options || {};
    
    const skip = (page - 1) * limit;

    const where: any = {};
    
    // Status Filter
    if (status) {
      where.status = status;
    } else {
      where.status = { not: 'DRAFT' };
    }

    // Direct Filters
    if (gradeLevel) where.gradeLevel = gradeLevel;
    if (specialty) where.specialty = specialty;
    if (shift) where.shift = shift;
    if (assignedToId) where.assignedToId = assignedToId;
    if (processedById) where.processedById = processedById;

    // Parallel Filter
    if (assignedParallel) {
      if (assignedParallel === 'none') {
        where.assignedParallel = null;
      } else {
        where.assignedParallel = assignedParallel;
      }
    }

    // Date Range Filter
    if (startDate || endDate) {
      where.submittedAt = {};
      if (startDate) where.submittedAt.gte = new Date(startDate);
      if (endDate) {
        // Add 1 day to include the end date fully
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        where.submittedAt.lt = end;
      }
    }

    // Advanced Search (Name or Cedula)
    if (search) {
      where.OR = [
        { studentFirstName: { contains: search, mode: 'insensitive' } },
        { studentLastName: { contains: search, mode: 'insensitive' } },
        { studentCedula: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [applications, total] = await Promise.all([
      this.prisma.application.findMany({
        where,
        include: {
          documents: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          processedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.application.count({ where }),
    ]);

    return {
      data: applications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Poner en revisión
  async setUnderReview(id: string) {
    const updatedApp = await this.prisma.application.update({
      where: { id },
      data: { status: 'UNDER_REVIEW' },
    });

    // Notify User
    await this.notificationsService.createForApplicationStatus(
      updatedApp.userId,
      id,
      `${updatedApp.studentFirstName} ${updatedApp.studentLastName}`,
      'APPLICATION_UNDER_REVIEW'
    );

    return updatedApp;
  }

  // Solicitar correcciones
  async requestCorrection(id: string, correctionRequest: string) {
    const updatedApp = await this.prisma.application.update({
      where: { id },
      data: {
        status: 'REQUIRES_CORRECTION',
        correctionRequest,
      },
    });

    // Notify User
    await this.notificationsService.createForApplicationStatus(
      updatedApp.userId,
      id,
      `${updatedApp.studentFirstName} ${updatedApp.studentLastName}`,
      'CORRECTION_REQUIRED',
      correctionRequest
    );

    return updatedApp;
  }

  // Aprobar solicitud
  async approve(id: string, adminNotes?: string) {
    const updatedApp = await this.prisma.application.update({
      where: { id },
      data: {
        status: 'APPROVED',
        adminNotes,
      },
    });

    // Notify User
    await this.notificationsService.createForApplicationStatus(
      updatedApp.userId,
      id,
      `${updatedApp.studentFirstName} ${updatedApp.studentLastName}`,
      'APPLICATION_APPROVED'
    );

    return updatedApp;
  }

  // Rechazar solicitud
  async reject(id: string, rejectionReason: string) {
    const updatedApp = await this.prisma.application.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason,
      },
    });

    // Notify User
    await this.notificationsService.createForApplicationStatus(
      updatedApp.userId,
      id,
      `${updatedApp.studentFirstName} ${updatedApp.studentLastName}`,
      'APPLICATION_REJECTED',
      rejectionReason
    );

    return updatedApp;
  }

  // Asignar a directivo
  async assignToDirectivo(id: string, directivoId: string, assignedBy: string) {
    const updatedApp = await this.prisma.application.update({
      where: { id },
      data: {
        assignedToId: directivoId,
        assignedAt: new Date(),
      },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    // Notify Director (assigned user)
    await this.notificationsService.create({
      userId: directivoId,
      type: 'APPLICATION_UNDER_REVIEW', // Or custom type
      priority: 'HIGH',
      message: `Nueva solicitud asignada para revisión: ${updatedApp.studentFirstName} ${updatedApp.studentLastName}`,
      applicationId: id,
    });

    return updatedApp;
  }

  // Agregar comentario interno
  async addInternalComment(id: string, comment: string, user: any) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      select: { internalComments: true },
    });

    const currentComments = (application?.internalComments as any[]) || [];
    const newComment = {
      userId: user.sub,
      userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      comment,
      createdAt: new Date().toISOString(),
    };

    return this.prisma.application.update({
      where: { id },
      data: {
        internalComments: [...currentComments, newComment],
      },
    });
  }

  // Obtener solicitudes asignadas a un directivo
  async getAssignedTo(
    userId: string,
    options?: {
      status?: ApplicationStatus;
      gradeLevel?: string;
      search?: string;
      startDate?: string;
      endDate?: string;
      specialty?: string;
      shift?: Shift;
    }
  ) {
    const { status, gradeLevel, search, startDate, endDate, specialty, shift } = options || {};
    
    const where: any = { assignedToId: userId };

    if (status) where.status = status;
    if (gradeLevel) where.gradeLevel = gradeLevel;
    if (specialty) where.specialty = specialty;
    if (shift) where.shift = shift;

    // Date Range Filter
    if (startDate || endDate) {
      where.assignedAt = {};
      if (startDate) where.assignedAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        where.assignedAt.lt = end;
      }
    }

    // Advanced Search
    if (search) {
      where.OR = [
        { studentFirstName: { contains: search, mode: 'insensitive' } },
        { studentLastName: { contains: search, mode: 'insensitive' } },
        { studentCedula: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.application.findMany({
      where,
      include: {
        documents: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        processedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });
  }

  // Verificar disponibilidad de cupos
  async checkQuota(gradeLevel: string, shift: string) {
    if (!gradeLevel || !shift) {
      return { status: 'AVAILABLE', available: 30, total: 30 };
    }

    const QUOTA_LIMIT = 30; // Hardcoded limit per classroom/shift

    // Contar estudiantes aprobados en este grado y jornada
    const approvedCount = await this.prisma.application.count({
      where: {
        gradeLevel,
        shift: shift as Shift,
        status: 'APPROVED',
      },
    });

    const available = Math.max(0, QUOTA_LIMIT - approvedCount);
    
    let status = 'AVAILABLE';
    if (available === 0) status = 'FULL';
    else if (available <= 5) status = 'LIMITED';

    return {
      status, // AVAILABLE, LIMITED, FULL
      available,
      total: QUOTA_LIMIT,
      used: approvedCount
    };
  }

  // Obtener paralelos disponibles para una solicitud
  async getAvailableParallels(id: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      select: { gradeLevel: true, shift: true, specialty: true }
    });

    if (!application) throw new NotFoundException('Solicitud no encontrada');

    // 1. Obtener configuración de cupos (AdmissionQuota) para este nivel/jornada
    // Si no existe configuración específica, asumimos paralelos por defecto "A", "B", "C"
    // O buscamos qué paralelos tienen cupos definidos.
    
    // Por simplicidad para el MVP:
    // Buscamos todas las Quotas definidas para este Nivel + Jornada (+ Especialidad si aplica)
    const quotas = await this.prisma.admissionQuota.findMany({
      where: {
        level: application.gradeLevel,
        shift: application.shift as string,
        // specialty: application.specialty // Opcional, dependiendo de si la quota se define con especialidad
      }
    });

    // Si no hay quotas configuradas, retornamos un paralelo "A" por defecto con cupo estático
    if (quotas.length === 0) {
      // Fallback logic
      const defaultParallels = ['A', 'B', 'C'];
      const result = [];
      const MAX_QUOTA = 30;

      for (const p of defaultParallels) {
        const count = await this.prisma.application.count({
          where: {
            gradeLevel: application.gradeLevel,
            shift: application.shift as Shift,
            assignedParallel: p,
            status: 'MATRICULATED' as ApplicationStatus
          }
        });
        result.push({
          parallel: p,
          totalQuota: MAX_QUOTA,
          used: count,
          available: Math.max(0, MAX_QUOTA - count)
        });
      }
      return result;
    }

    // Si hay quotas, procesamos cada una
    const result = [];
    for (const q of quotas) {
      // Si es BGU y tiene especialidad, filtramos
      if (application.specialty && q.specialty && application.specialty !== q.specialty) {
        continue;
      }

      const count = await this.prisma.application.count({
        where: {
          gradeLevel: application.gradeLevel,
          shift: application.shift as Shift,
          assignedParallel: q.parallel,
          status: 'MATRICULATED' as ApplicationStatus
        }
      });

      result.push({
        parallel: q.parallel,
        totalQuota: q.totalQuota,
        used: count,
        available: Math.max(0, q.totalQuota - count)
      });
    }

    return result;
  }

  // Asignar paralelo y matricular
  async assignParallel(id: string, parallel: string, userId: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
    });

    if (!application) throw new NotFoundException('Solicitud no encontrada');

    // Validar estado habilitado para asignación
    // Aceptamos APPROVED o PAYMENT_VALIDATED
    if (!['APPROVED', 'PAYMENT_VALIDATED'].includes(application.status)) {
       throw new BadRequestException('La solicitud debe estar APROBADA o con PAGO VALIDADO para asignar paralelo.');
    }

    // Verificar cupo disponible en el paralelo seleccionado
    // 1. Obtener límite (Quota)
    let limit = 30; // Default
    const quota = await this.prisma.admissionQuota.findFirst({
      where: {
        level: application.gradeLevel,
        shift: application.shift as string,
        parallel: parallel,
        // specialty: application.specialty || undefined 
        // Nota: Ajustar query de especialidad según modelo exacto
      }
    });

    if (quota) {
      limit = quota.totalQuota;
    }

    // 2. Contar usados
    const used = await this.prisma.application.count({
      where: {
        gradeLevel: application.gradeLevel,
        shift: application.shift as Shift,
        assignedParallel: parallel,
        status: 'MATRICULATED' as ApplicationStatus
      }
    });

    if (used >= limit) {
      throw new BadRequestException(`El paralelo ${parallel} no tiene cupos disponibles.`);
    }

    // 3. Asignar
    const updated = await this.prisma.application.update({
      where: { id },
      data: {
        assignedParallel: parallel,
        status: 'MATRICULATED' as ApplicationStatus,
        processedById: userId, // Guardamos quién matriculó
        processedAt: new Date()
      }
    });

    // Notify User
    await this.notificationsService.createForApplicationStatus(
      updated.userId,
      id,
      `${updated.studentFirstName} ${updated.studentLastName}`,
      // @ts-ignore
      'MATRICULATED' // Necesitaremos agregar este tipo de notificacion o usar uno generico
    );

    return updated;
  }

  // Exportar admitidos CSV
  async exportAdmittedCsv() {
    const applications = await this.prisma.application.findMany({
      where: { status: 'APPROVED' },
      include: {
        user: true,
      },
      orderBy: { studentLastName: 'asc' },
    });

    const headers = [
      'Cedula Estudiante',
      'Apellidos',
      'Nombres',
      'Grado',
      'Jornada',
      'Email Apoderado',
      'Telefono',
      'Fecha Aprobacion'
    ].join(',');

    const rows = applications.map(app => {
      const data = [
        app.studentCedula,
        app.studentLastName,
        app.studentFirstName,
        app.gradeLevel,
        app.shift,
        app.user?.email || '',
        app.studentPhone || '',
        app.updatedAt.toISOString().split('T')[0]
      ];
      return data.map(field => `"${String(field || '').replace(/"/g, '""')}"`).join(',');
    });

    return [headers, ...rows].join('\n');
  }

  // === MÉTODOS PRIVADOS ===

  private async findOneOrFail(id: string, userId: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: { documents: true },
    });

    if (!application) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    if (application.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para acceder a esta solicitud');
    }

    return application;
  }

  private validateRequiredFields(application: any) {
    const requiredFields = [
      'studentFirstName',
      'studentLastName',
      'studentCedula',
      'studentBirthDate',
      'studentGender',
      'studentAddress',
      'gradeLevel',
      'shift',
      'representativeData',
    ];

    const missingFields = requiredFields.filter(field => !application[field]);

    if (missingFields.length > 0) {
      throw new BadRequestException(
        `Campos requeridos faltantes: ${missingFields.join(', ')}`
      );
    }
  }

  private async validateRequiredDocuments(applicationId: string) {
    const documents = await this.prisma.applicationDocument.findMany({
      where: { applicationId },
    });

    const requiredTypes = ['STUDENT_ID', 'REPRESENTATIVE_ID', 'STUDENT_PHOTO', 'GRADE_CERTIFICATE', 'UTILITY_BILL'];
    const uploadedTypes = documents.map(d => d.documentType);
    const missingTypes = requiredTypes.filter(type => !uploadedTypes.includes(type as any));

    if (missingTypes.length > 0) {
      throw new BadRequestException(
        `Documentos requeridos faltantes: ${missingTypes.join(', ')}`
      );
    }
  }
}
