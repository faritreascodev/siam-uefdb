import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApplicationDto, UpdateApplicationDto } from './dto/create-application.dto';
import { ApplicationStatus, Shift } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ApplicationsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private auditService: AuditService
  ) { }

  // Crear nueva solicitud (borrador)
  async create(userId: string) {
    // Verificar si el portal de admisiones está abierto
    const admissionConfig = await this.prisma.systemConfig.findUnique({
      where: { key: 'ADMISSION_OPEN' }
    });
    const isOpen = !admissionConfig || admissionConfig.value === 'true';

    if (!isOpen) {
      // Verificar si el usuario es admin/secretaria (pueden operar siempre)
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { roles: true }
      });
      const roles = user?.roles?.map((r: any) => (r.name || '').toLowerCase()) || [];
      const isPrivileged = roles.some((r: string) => ['superadmin', 'admin', 'secretaria', 'rector'].includes(r));

      if (!isPrivileged) {
        throw new BadRequestException('El portal de admisiones está cerrado. No se aceptan nuevas solicitudes en este momento.');
      }
    }

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
      let modifiedDto = { ...dto };

      // Si se envía la cédula, realizar chequeo de continuidad de estudiantes
      if (modifiedDto.studentCedula) {
        modifiedDto = await this.checkStudentContinuity(modifiedDto.studentCedula, modifiedDto);
      }

      const { extraContacts, ...restDto } = modifiedDto;

      return await this.prisma.application.update({
        where: { id },
        data: {
          ...restDto,
          studentBirthDate: restDto.studentBirthDate ? new Date(restDto.studentBirthDate) : undefined,
          studentBirthPlace: restDto.studentBirthPlace ? JSON.parse(JSON.stringify(restDto.studentBirthPlace)) : undefined,
          fatherData: restDto.fatherData ? JSON.parse(JSON.stringify(restDto.fatherData)) : undefined,
          motherData: restDto.motherData ? JSON.parse(JSON.stringify(restDto.motherData)) : undefined,
          representativeData: restDto.representativeData ? JSON.parse(JSON.stringify(restDto.representativeData)) : undefined,
          acceptedAt: restDto.acceptedIdeario ? new Date() : undefined,
          extraContacts: extraContacts ? {
            deleteMany: {},
            create: extraContacts.map(ec => ({
              cedula: ec.cedula || '',
              firstName: ec.firstName,
              lastName: ec.lastName,
              email: ec.email,
              phone: ec.phone,
              relationship: ec.relationship,
            }))
          } : undefined,
        },
        include: {
          documents: true,
          extraContacts: true,
        },
      });
    } catch (error) {
      if (error.code === 'P2002' && error.meta?.target?.includes('studentCedula')) {
        // Buscar la solicitud que tiene esa cédula para dar contexto
        const conflict = dto.studentCedula ? await this.prisma.application.findFirst({
          where: { studentCedula: dto.studentCedula },
          select: { id: true, status: true, userId: true }
        }) : null;

        // Si el conflicto es la misma solicitud, no hay problema (no debería pasar pero por seguridad)
        if (conflict && conflict.id === id) {
          throw error;
        }

        // Si el conflicto tiene un estado final, la cédula está libre para un nuevo ciclo
        const finalStatuses = ['REJECTED', 'CURSILLO_REJECTED', 'MATRICULATED'];
        if (conflict && finalStatuses.includes(conflict.status)) {
          // La solicitud antigua está terminada. Liberar la cédula poniendo la anterior a null antes de reintentar
          await this.prisma.application.update({
            where: { id: conflict.id },
            data: { studentCedula: null }
          });
          // Reintentar la operación original
          const { extraContacts, ...retryDto } = dto;
          return await this.prisma.application.update({
            where: { id },
            data: {
              ...retryDto,
              studentBirthDate: retryDto.studentBirthDate ? new Date(retryDto.studentBirthDate) : undefined,
              studentBirthPlace: retryDto.studentBirthPlace ? JSON.parse(JSON.stringify(retryDto.studentBirthPlace)) : undefined,
              fatherData: retryDto.fatherData ? JSON.parse(JSON.stringify(retryDto.fatherData)) : undefined,
              motherData: retryDto.motherData ? JSON.parse(JSON.stringify(retryDto.motherData)) : undefined,
              representativeData: retryDto.representativeData ? JSON.parse(JSON.stringify(retryDto.representativeData)) : undefined,
              acceptedAt: retryDto.acceptedIdeario ? new Date() : undefined,
            },
            include: { documents: true, extraContacts: true },
          });
        }

        // Si la solicitud conflictiva está activa, sí es un duplicado real
        throw new BadRequestException(
          'Este estudiante ya tiene una solicitud activa en el sistema. Si necesita crear una nueva, primero finalice o elimine la solicitud existente.'
        );
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

    // Validar historial académico si es estudiante antiguo
    if (application.enrollmentType === 'RETURNING_STUDENT' && application.studentCedula) {
      const record = await this.prisma.academicRecord.findFirst({
        where: { studentCedula: application.studentCedula },
        orderBy: { academicYear: 'desc' }
      });

      if (record) {
        if (record.status === 'FAILED_YEAR') {
          throw new BadRequestException('El estudiante reprobó el año lectivo anterior y debe repetir el curso, por favor contacte a secretaría.');
        }
        if (record.status.includes('PENDING')) {
          throw new BadRequestException(`El estudiante no puede matricularse aún porque tiene exámenes pendientes (${record.status}).`);
        }
        // Si es PASSED, el sistema permitirá avanzar normalmente
      }
    }

    // Validar documentos requeridos
    await this.validateRequiredDocuments(application);

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

    // Notify Admins and Secretaries
    await this.notificationsService.notifyRole('admin', {
      type: 'APPLICATION_SUBMITTED',
      message: `Nueva solicitud recibida: ${application.studentFirstName} ${application.studentLastName}`,
      applicationId: id,
      priority: 'HIGH'
    });

    await this.notificationsService.notifyRole('secretaria', {
      type: 'APPLICATION_SUBMITTED',
      message: `Nueva solicitud recibida: ${application.studentFirstName} ${application.studentLastName}`,
      applicationId: id,
      priority: 'NORMAL'
    });

    // Audit Log
    await this.auditService.create({
      action: 'SUBMIT_APPLICATION',
      entity: 'Application',
      entityId: id,
      userId,
      details: { student: `${application.studentFirstName} ${application.studentLastName}` }
    });

    return updatedApp;
  }

  // Listar solicitudes del usuario (apoderado)
  async findMyApplications(userId: string) {
    return this.prisma.application.findMany({
      where: { userId },
      include: {
        documents: true,
        extraContacts: true,
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
        extraContacts: true,
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

  async bulkApprove(ids: string[], user: any) {
    const results = await this.prisma.application.updateMany({
      where: {
        id: { in: ids },
        status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'CURSILLO_APPROVED'] }
      },
      data: {
        status: 'APPROVED',
        acceptedAt: new Date(),
        adminNotes: 'Aprobación masiva del sistema'
      }
    });

    // Notify users
    const apps = await this.prisma.application.findMany({
      where: { id: { in: ids } },
      select: { id: true, userId: true, studentFirstName: true, studentLastName: true }
    });

    for (const app of apps) {
      await this.notificationsService.createForApplicationStatus(
        app.userId,
        app.id,
        `${app.studentFirstName} ${app.studentLastName}`,
        'APPLICATION_APPROVED'
      );

      await this.auditService.create({
        action: 'APPROVE_APPLICATION',
        entity: 'Application',
        entityId: app.id,
        details: { mode: 'bulk' },
        userId: user.id || user.sub,
        userEmail: user.email,
      });
    }

    return results;
  }

  async bulkReject(ids: string[], reason: string, user: any) {
    const results = await this.prisma.application.updateMany({
      where: { id: { in: ids } },
      data: {
        status: 'REJECTED',
        rejectionReason: reason
      }
    });

    // Notify users
    const apps = await this.prisma.application.findMany({
      where: { id: { in: ids } },
      select: { id: true, userId: true, studentFirstName: true, studentLastName: true }
    });

    for (const app of apps) {
      await this.notificationsService.createForApplicationStatus(
        app.userId,
        app.id,
        `${app.studentFirstName} ${app.studentLastName}`,
        'APPLICATION_REJECTED',
        reason
      );

      await this.auditService.create({
        action: 'REJECT_APPLICATION',
        entity: 'Application',
        entityId: app.id,
        details: { mode: 'bulk', reason },
        userId: user.id || user.sub,
        userEmail: user.email,
      });
    }

    return results;
  }

  // === PAGOS DE MATRÍCULA ===

  async uploadPaymentDetails(id: string, userId: string, paymentDate: string, paymentReference?: string) {
    const application = await this.prisma.application.findUnique({ where: { id } });

    if (!application) throw new NotFoundException('Solicitud no encontrada');
    if (application.userId !== userId) throw new ForbiddenException('No tienes permiso para actualizar esta solicitud');
    if (!['APPROVED', 'CURSILLO_APPROVED', 'PAYMENT_UPLOADED'].includes(application.status)) {
      throw new BadRequestException('Para subir el comprobante, la solicitud debe estar Aprobada (o con Cursillo Aprobado).');
    }

    const updatedApp = await this.prisma.application.update({
      where: { id },
      data: {
        status: 'PAYMENT_UPLOADED',
        paymentDate: new Date(paymentDate),
        paymentReference,
        updatedAt: new Date(),
      },
      include: { documents: true },
    });

    // Notify the apoderado
    const studentName = `${updatedApp.studentFirstName || ''} ${updatedApp.studentLastName || ''}`.trim();
    await this.notificationsService.notifyPaymentUploaded(userId, id, studentName);

    // Notify admin staff (secretaries, admins)
    await this.notificationsService.notifyAdminStaffPaymentUploaded(id, studentName);

    await this.auditService.create({
      action: 'PAYMENT_UPLOADED',
      entity: 'Application',
      entityId: id,
      userId,
      details: { paymentDate, paymentReference }
    });

    return updatedApp;
  }

  async validatePayment(id: string, isValid: boolean, reason?: string, userId?: string) {
    const application = await this.prisma.application.findUnique({ where: { id } });

    if (!application) throw new NotFoundException('Solicitud no encontrada');
    if (application.status !== 'PAYMENT_UPLOADED') throw new BadRequestException('No hay un pago pendiente de validación');

    if (isValid) {
      const updatedApp = await this.prisma.application.update({
        where: { id },
        data: { status: 'PAYMENT_VALIDATED', processedById: userId, processedAt: new Date() },
        include: { documents: true },
      });

      const studentName = `${updatedApp.studentFirstName || ''} ${updatedApp.studentLastName || ''}`.trim();
      await this.notificationsService.notifyPaymentValidated(updatedApp.userId, id, studentName);

      return updatedApp;
    } else {
      const updatedApp = await this.prisma.application.update({
        where: { id },
        data: { status: 'APPROVED', processedById: userId, processedAt: new Date() },
        include: { documents: true },
      });

      const studentName = `${updatedApp.studentFirstName || ''} ${updatedApp.studentLastName || ''}`.trim();
      await this.notificationsService.notifyPaymentRejected(updatedApp.userId, id, studentName, reason);

      return updatedApp;
    }
  }

  /**
   * Eliminar solicitud completa (liberar cupo).
   * Solo para admins, y solo si la solicitud está en REJECTED o CURSILLO_REJECTED.
   */
  async adminRemove(id: string, adminUserId: string) {
    const application = await this.prisma.application.findUnique({ where: { id } });
    if (!application) throw new NotFoundException('Solicitud no encontrada');

    const allowedStatuses: ApplicationStatus[] = ['REJECTED', 'CURSILLO_REJECTED'];
    if (!allowedStatuses.includes(application.status as ApplicationStatus)) {
      throw new BadRequestException(
        `Solo se puede eliminar solicitudes con estado REJECTED o CURSILLO_REJECTED. Estado actual: ${application.status}`
      );
    }

    const studentName = `${application.studentFirstName} ${application.studentLastName}`;
    await this.prisma.application.delete({ where: { id } });

    await this.auditService.create({
      action: 'ADMIN_DELETE_APPLICATION',
      entity: 'Application',
      entityId: id,
      userId: adminUserId,
      details: { student: studentName, previousStatus: application.status },
    });

    return { message: `Solicitud de ${studentName} eliminada. Cupo liberado.`, id };
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
      paymentValidated: applications.filter(a => a.status === 'PAYMENT_VALIDATED').length,
      matriculated: applications.filter(a => a.status === 'MATRICULATED').length,
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

    // Audit Log
    await this.auditService.create({
      action: 'REQUEST_CORRECTION',
      entity: 'Application',
      entityId: id,
      details: { correctionRequest }
    });

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

    // Audit Log
    await this.auditService.create({
      action: 'APPROVE_APPLICATION',
      entity: 'Application',
      entityId: id,
      userId: adminNotes?.includes('SYSTEM') ? 'SYSTEM' : undefined, // We'll improve this with req.user later
      details: { adminNotes }
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

    // Audit Log
    await this.auditService.create({
      action: 'REJECT_APPLICATION',
      entity: 'Application',
      entityId: id,
      details: { rejectionReason }
    });

    return updatedApp;
  }


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

  // Verificar disponibilidad de cupos (general)
  async checkQuota(gradeLevel: string, shift: string, previousSchool?: string) {
    if (!gradeLevel || !shift) {
      return { status: 'AVAILABLE', available: 0, total: 0, used: 0, requiresCursillo: false };
    }

    const mapLevel = (level: string) => {
      const mapping: Record<string, string> = {
        'inicial_1': 'Inicial 1 (3 años)',
        'inicial_2': 'Inicial 2 (4 años)',
        '1ro_basico': '1ero EGB',
        '2do_basico': '2do EGB',
        '3ro_basico': '3ero EGB',
        '4to_basico': '4to EGB',
        '5to_basico': '5to EGB',
        '6to_basico': '6to EGB',
        '7mo_basico': '7mo EGB',
        '8vo_basico': '8vo EGB',
        '9no_basico': '9no EGB',
        '10mo_basico': '10mo EGB',
        '1ro_bachillerato': '1ero BGU',
        '2do_bachillerato': '2do BGU',
        '3ro_bachillerato': '3ero BGU',
      };
      return mapping[level] || level;
    };

    const mapShift = (s: string) => {
      if (s === 'MORNING') return 'Matutina';
      if (s === 'AFTERNOON') return 'Vespertina';
      return s;
    };

    const mappedLevel = mapLevel(gradeLevel);
    const mappedShift = mapShift(shift);

    // Sum all quotas for this level and shift
    const quotas = await this.prisma.admissionQuota.findMany({
      where: {
        level: mappedLevel,
        shift: mappedShift,
      }
    });

    const totalQuota = quotas.reduce((sum, q) => sum + q.totalQuota, 0);

    // Contar estudiantes ocupando cupo
    const approvedCount = await this.prisma.application.count({
      where: {
        gradeLevel,
        shift: shift as Shift,
        status: {
          in: ['APPROVED', 'CURSILLO_APPROVED', 'PAYMENT_VALIDATED', 'MATRICULATED']
        }
      },
    });

    const available = Math.max(0, totalQuota - approvedCount);

    let status = 'AVAILABLE';
    if (totalQuota === 0) status = 'FULL';
    else if (available === 0) status = 'FULL';
    else if (available <= 5) status = 'LIMITED';

    const reqCursillo = (() => {
      const grade = gradeLevel.toUpperCase();
      const isSpecialGrade = grade.includes('8VO') || grade.includes('1RO BGU') || grade.includes('1ERO BGU');
      if (!isSpecialGrade) return false;
      if (previousSchool) {
        const school = previousSchool.toUpperCase();
        if (school.includes('UEFDB') || school.includes('DON BOSCO') || school.includes('FISCOMISIONAL')) {
          return false;
        }
      }
      return true;
    })();

    return {
      status, // AVAILABLE, LIMITED, FULL
      available,
      total: totalQuota,
      used: approvedCount,
      requiresCursillo: reqCursillo
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
    const allowedStatuses: ApplicationStatus[] = ['PAYMENT_VALIDATED', 'CURSILLO_APPROVED'];
    if (!allowedStatuses.includes(application.status)) {
      throw new BadRequestException('Para matricular y asignar paralelo debe tener el pago validado o el cursillo aprobado.');
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

    const shiftStr = updated.shift === 'MORNING' ? 'Matutina' : 'Vespertina';
    const gradeStr = updated.gradeLevel || 'N/A';
    const parallelStr = updated.assignedParallel || 'N/A';
    const assignmentDetails = `Curso: ${gradeStr}, Jornada: ${shiftStr}, Paralelo: ${parallelStr}`;

    // Notify User
    await this.notificationsService.createForApplicationStatus(
      updated.userId,
      id,
      `${updated.studentFirstName} ${updated.studentLastName}`,
      // @ts-ignore
      'MATRICULATED',
      assignmentDetails
    );

    // Audit Log
    await this.auditService.create({
      action: 'ASSIGN_PARALLEL_MATRICULATE',
      entity: 'Application',
      entityId: id,
      userId,
      details: { parallel, student: `${updated.studentFirstName} ${updated.studentLastName}` }
    });

    return updated;
  }

  // === CURSILLOS ===

  // Programar cursillo
  async scheduleCursillo(id: string, cursilloDate: string) {
    const updatedApp = await this.prisma.application.update({
      where: { id },
      data: {
        status: 'CURSILLO_SCHEDULED',
        cursilloScheduled: true,
        cursilloDate: new Date(cursilloDate),
      },
    });

    // Notify User
    await this.notificationsService.createForApplicationStatus(
      updatedApp.userId,
      id,
      `${updatedApp.studentFirstName} ${updatedApp.studentLastName}`,
      'APPLICATION_UNDER_REVIEW', // O uno específico de Cursillo si existiera
      `Se ha programado un cursillo para el ${new Date(cursilloDate).toLocaleDateString('es-ES')}`
    );

    return updatedApp;
  }

  // Registrar resultado del cursillo
  async recordCursilloResult(id: string, result: 'APPROVED' | 'REJECTED', notes?: string) {
    const statusMap = {
      APPROVED: 'CURSILLO_APPROVED',
      REJECTED: 'CURSILLO_REJECTED'
    };

    const updatedApp = await this.prisma.application.update({
      where: { id },
      data: {
        status: statusMap[result] as ApplicationStatus,
        cursilloResult: result,
        cursilloNotes: notes,
      },
    });

    const resultMessage = result === 'APPROVED' ? 'Aprobado' : 'Rechazado';

    // Notify User
    await this.notificationsService.createForApplicationStatus(
      updatedApp.userId,
      id,
      `${updatedApp.studentFirstName} ${updatedApp.studentLastName}`,
      'APPLICATION_UNDER_REVIEW',
      `El resultado de su cursillo ha sido registrado: ${resultMessage}. ${notes || ''}`
    );

    return updatedApp;
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
      include: { documents: true, extraContacts: true },
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

    const isBGU = [
      '1ero BGU', '2do BGU', '3ro BGU',
      // retrocompatibilidad
      '1ro_bachillerato', '2do_bachillerato', '3ro_bachillerato',
    ].includes(application.gradeLevel || '');
    if (isBGU && !application.specialty) {
      missingFields.push('specialty');
    }

    if (missingFields.length > 0) {
      throw new BadRequestException(
        `Campos requeridos faltantes: ${missingFields.join(', ')}`
      );
    }
  }

  // --- NUEVO: BÚSQUEDA POR CÉDULA CON MOCK (Para Estudiantes Antiguos) ---
  async searchByCedula(cedula: string) {
    // 1. Intentar buscar en la base de datos de records académicos reales
    const record = await this.prisma.academicRecord.findFirst({
      where: { studentCedula: cedula },
      orderBy: { academicYear: 'desc' }
    });

    if (record) {
      // Si existe record, intentamos traer la última aplicación para completar datos
      const lastApp = await this.prisma.application.findFirst({
        where: { studentCedula: cedula },
        orderBy: { createdAt: 'desc' }
      });

      return {
        found: true,
        source: 'database',
        enrollmentType: 'RETURNING_STUDENT',
        status: record.status,
        finalAverage: record.finalAverage,
        studentData: {
          firstName: lastApp?.studentFirstName,
          lastName: lastApp?.studentLastName,
          gender: lastApp?.studentGender,
          birthDate: lastApp?.studentBirthDate,
          nationality: lastApp?.studentNationality,
          address: lastApp?.studentAddress,
          email: lastApp?.studentEmail,
          phone: lastApp?.studentPhone,
          bloodType: lastApp?.bloodType,
          previousSchool: 'Unidad Educativa Fiscomisional Don Bosco',
        },
        familyData: {
          father: lastApp?.fatherData,
          mother: lastApp?.motherData,
          representative: lastApp?.representativeData,
        },
        studentPhotoUrl: lastApp ? (await this.prisma.applicationDocument.findFirst({
          where: { applicationId: lastApp.id, documentType: 'STUDENT_PHOTO' }
        }))?.fileUrl : undefined
      };
    }

    // 2. MOCK DATA (Simulando el array de PHP proporcionado)
    const mockData: Record<string, any> = {
      '0950000001': {
        firstName: 'Ana',
        lastName: 'González Pez',
        gender: 'F',
        birthDate: '2012-05-15',
        nationality: 'ECUATORIANA',
        address: 'Sector Las Palmas, Calle Principal 123',
        email: 'ana.gonzalez@estudiante.ec',
        phone: '0987654321',
        bloodType: 'O+',
        father: { names: 'Luis González', cedula: '0801122334', phone: '0991122334', workPlace: 'Municipio' },
        mother: { names: 'Marta Pez', cedula: '0802233445', phone: '0992233445', workPlace: 'Hospital' },
        representative: { names: 'Luis González', relationship: 'Padre', cedula: '0801122334', phone: '0991122334' }
      },
      '0950000002': {
        firstName: 'Pedro',
        lastName: 'González Ávila',
        gender: 'M',
        birthDate: '2011-08-20',
        nationality: 'ECUATORIANA',
        address: 'Barrio Caliente, Calle 10 y Ave 5',
        email: 'pedro.gonzalez@estudiante.ec',
        phone: '0981234567',
        bloodType: 'A+',
        father: { names: 'Jorge González', cedula: '0803344556', phone: '0993344556', workPlace: 'Puerto' },
        mother: { names: 'Lucía Ávila', cedula: '0804455667', phone: '0994455667', workPlace: 'Docente' },
        representative: { names: 'Jorge González', relationship: 'Padre', cedula: '0803344556', phone: '0993344556' }
      }
    };

    if (mockData[cedula]) {
      return {
        found: true,
        source: 'mock',
        enrollmentType: 'RETURNING_STUDENT',
        status: 'PASSED',
        finalAverage: 9.5,
        studentData: {
          ...mockData[cedula],
          previousSchool: 'Unidad Educativa Fiscomisional Don Bosco',
        },
        familyData: {
          father: mockData[cedula].father,
          mother: mockData[cedula].mother,
          representative: mockData[cedula].representative,
        }
      };
    }

    return { found: false };
  }

  private async validateRequiredDocuments(application: any) {
    const documents = await this.prisma.applicationDocument.findMany({
      where: { applicationId: application.id },
    });

    const configDocsNew = await this.prisma.systemConfig.findUnique({ where: { key: 'REQUIRED_DOCUMENTS_NEW' } });
    const configDocsRet = await this.prisma.systemConfig.findUnique({ where: { key: 'REQUIRED_DOCUMENTS_RETURNING' } });

    let requiredTypes = ['STUDENT_ID', 'REPRESENTATIVE_ID', 'STUDENT_PHOTO', 'GRADE_CERTIFICATE', 'UTILITY_BILL'];
    if (configDocsNew?.value) {
      try { requiredTypes = JSON.parse(configDocsNew.value); } catch { }
    }

    // Si es estudiante antiguo, usa sus propios requerimientos
    if (application.enrollmentType === 'RETURNING_STUDENT') {
      requiredTypes = ['STUDENT_ID', 'REPRESENTATIVE_ID', 'STUDENT_PHOTO'];
      if (configDocsRet?.value) {
        try { requiredTypes = JSON.parse(configDocsRet.value); } catch { }
      }
    }

    const uploadedTypes = documents.map(d => d.documentType);
    const missingTypes = requiredTypes.filter(type => !uploadedTypes.includes(type as any));

    if (missingTypes.length > 0) {
      throw new BadRequestException(
        `Documentos requeridos faltantes: ${missingTypes.join(', ')}`
      );
    }
  }

  // --- NUEVO: FUNCIONALIDAD ESTUDIANTE ANTIGUO AUTOMÁTICA ---
  private async checkStudentContinuity(studentCedula: string, currentData: Partial<UpdateApplicationDto>): Promise<Partial<UpdateApplicationDto>> {
    const record = await this.prisma.academicRecord.findFirst({
      where: { studentCedula },
      orderBy: { academicYear: 'desc' }
    });

    if (record) {
      if (record.status === 'FAILED_YEAR') {
        throw new BadRequestException('El estudiante reprobó el año anterior. Diríjase a secretaría militar y pague la respectiva multa y complete el trámite de retención de cupo manual.');
      } else if (record.status.includes('PENDING')) {
        throw new BadRequestException(`El estudiante tiene exámenes de supletorio/gracia pendientes. No puede enviar la solicitud de matrícula aún.`);
      } else if (record.status === 'PASSED') {
        // Cargar última info de la aplicación si existe
        const lastApp = await this.prisma.application.findFirst({
          where: { studentCedula },
          orderBy: { createdAt: 'desc' }
        });

        return {
          ...currentData,
          enrollmentType: 'RETURNING_STUDENT',
          studentFirstName: currentData.studentFirstName || lastApp?.studentFirstName || undefined,
          studentLastName: currentData.studentLastName || lastApp?.studentLastName || undefined,
          studentBirthDate: currentData.studentBirthDate || lastApp?.studentBirthDate?.toISOString() || undefined,
          studentGender: currentData.studentGender || lastApp?.studentGender || undefined,
          studentNationality: currentData.studentNationality || lastApp?.studentNationality || undefined,
          studentAddress: currentData.studentAddress || lastApp?.studentAddress || undefined,
          previousSchool: 'Unidad Educativa Fiscomisional Don Bosco',
          lastYearAverage: record.finalAverage ? Number(record.finalAverage) : undefined,
          fatherData: currentData.fatherData || (lastApp?.fatherData as any) || undefined,
          motherData: currentData.motherData || (lastApp?.motherData as any) || undefined,
          representativeData: currentData.representativeData || (lastApp?.representativeData as any) || undefined,
        };
      }
    }
    return currentData;
  }

  // --- NUEVO: VOLCADO DE FIN DE AÑO ---
  async executeRollover() {
    // Buscar todas las aplicaciones MATRICULATED del actual periodo
    const applications = await this.prisma.application.findMany({
      where: {
        status: 'MATRICULATED',
      }
    });

    let recordsCreated = 0;

    // Suponemos que el nuevo registro se crea para el próximo periodo 
    // Por motivos de simplicidad y base de demostración, pondremos un timestamp al academicYear
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const nextAcademicYear = `${currentYear}-${currentYear + 1}`;

    for (const app of applications) {
      if (!app.studentCedula) continue;

      // Chequear si ya hay record para este año
      const existingRecord = await this.prisma.academicRecord.findFirst({
        where: {
          studentCedula: app.studentCedula,
          academicYear: nextAcademicYear
        }
      });

      if (!existingRecord) {
        // En un caso real el Administrador ingresaría notas finales desde un Excel o similar.
        // Simulamos todos Aprobados por defecto en este dump para que pasen automáticamente,
        // o podrían migrarse según su 'gradeLevel'
        await this.prisma.academicRecord.create({
          data: {
            studentCedula: app.studentCedula,
            academicYear: nextAcademicYear,
            status: 'PASSED',
            finalAverage: 10.0,
            gradeLevel: app.gradeLevel || 'Desconocido'
          }
        });

        // Liberar el cupo si fuera necesario, aunque el nuevo ciclo de cupos empieza de 0 
        // con la configuración del admin cada nuevo periodo lectivo. 

        recordsCreated++;
      }
    }

    // Optionalmente se pueden archivar o mover al historial

    return {
      success: true,
      message: `Volcado completado. Se generaron ${recordsCreated} registros académicos históricos para el periodo ${nextAcademicYear}, liberando cupos para el nuevo periodo.`,
      recordsCreated,
    };
  }
}


