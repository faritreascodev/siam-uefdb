import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType, NotificationPriority } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) { }

  // Títulos predefinidos por tipo
  private getTitleForType(type: string): string {
    const titles: Record<string, string> = {
      APPLICATION_SUBMITTED: 'Solicitud Enviada',
      APPLICATION_DRAFT_SAVED: 'Borrador Guardado',
      CORRECTION_REQUIRED: 'Corrección Requerida',
      APPLICATION_APPROVED: '¡Solicitud Aprobada!',
      APPLICATION_REJECTED: 'Solicitud Rechazada',
      APPLICATION_UNDER_REVIEW: 'Solicitud en Revisión',
      DOCUMENT_REQUIRED: 'Documento Requerido',
      MATRICULATED: 'Matriculación Exitosa',
      PAYMENT_UPLOADED: 'Pago Subido',
      PAYMENT_VALIDATED: 'Pago Validado',
      PAYMENT_REJECTED: 'Pago Rechazado',
    };
    return titles[type] || 'Nueva Notificación';
  }

  // Prioridad predefinida por tipo
  private getPriorityForType(type: string): NotificationPriority {
    const priorities: Record<string, NotificationPriority> = {
      APPLICATION_SUBMITTED: 'NORMAL',
      APPLICATION_DRAFT_SAVED: 'LOW',
      CORRECTION_REQUIRED: 'HIGH',
      APPLICATION_APPROVED: 'NORMAL',
      APPLICATION_REJECTED: 'URGENT',
      APPLICATION_UNDER_REVIEW: 'NORMAL',
      DOCUMENT_REQUIRED: 'HIGH',
      MATRICULATED: 'HIGH',
      PAYMENT_UPLOADED: 'NORMAL',
      PAYMENT_VALIDATED: 'HIGH',
      PAYMENT_REJECTED: 'URGENT',
    };
    return priorities[type] || 'NORMAL';
  }

  // Crear notificación
  async create(data: {
    userId: string;
    type: NotificationType;
    message: string;
    applicationId?: string;
    priority?: NotificationPriority;
  }) {
    return this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        priority: data.priority || this.getPriorityForType(data.type),
        title: this.getTitleForType(data.type),
        message: data.message,
        applicationId: data.applicationId,
      },
    });
  }

  // Crear notificación para cambio de estado de solicitud
  async createForApplicationStatus(
    userId: string,
    applicationId: string,
    studentName: string,
    type: NotificationType,
    additionalInfo?: string,
  ) {
    const messages: Record<string, string> = {
      APPLICATION_SUBMITTED: `La solicitud de ${studentName} ha sido enviada correctamente`,
      APPLICATION_DRAFT_SAVED: `Borrador de ${studentName} guardado`,
      CORRECTION_REQUIRED: `La solicitud de ${studentName} necesita correcciones${additionalInfo ? `: ${additionalInfo}` : ''}`,
      APPLICATION_APPROVED: `¡Felicidades! La solicitud de ${studentName} ha sido aprobada`,
      APPLICATION_REJECTED: `La solicitud de ${studentName} no fue aprobada${additionalInfo ? `: ${additionalInfo}` : ''}`,
      APPLICATION_UNDER_REVIEW: `La solicitud de ${studentName} está siendo evaluada`,
      DOCUMENT_REQUIRED: `Falta un documento en la solicitud de ${studentName}`,
      MATRICULATED: `El estudiante ${studentName} ha sido matriculado correctamente.${additionalInfo ? ` Asignación - ${additionalInfo}` : ''}`,
      PAYMENT_UPLOADED: `El pago para la solicitud de ${studentName} ha sido subido.`,
      PAYMENT_VALIDATED: `El pago para la solicitud de ${studentName} ha sido validado.`,
      PAYMENT_REJECTED: `El pago para la solicitud de ${studentName} ha sido rechazado${additionalInfo ? `: ${additionalInfo}` : ''}.`,
    };

    return this.create({
      userId,
      type,
      message: messages[type] || 'Nueva notificación',
      applicationId,
    });
  }

  // Obtener notificaciones del usuario
  async findByUser(
    userId: string,
    options?: {
      isRead?: boolean;
      limit?: number;
    },
  ) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        ...(options?.isRead !== undefined && { isRead: options.isRead }),
      },
      include: {
        application: {
          select: {
            id: true,
            studentFirstName: true,
            studentLastName: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
    });
  }

  // Obtener conteo de no leídas
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  // Marcar como leída
  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  // Marcar todas como leídas
  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  // Notificar a todos los usuarios con un rol específico
  async notifyRole(roleName: string, data: {
    type: NotificationType;
    message: string;
    applicationId?: string;
    priority?: NotificationPriority;
  }) {
    const users = await this.prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: { name: roleName }
          }
        }
      },
      select: { id: true }
    });

    const notifications = users.map(user => ({
      userId: user.id,
      type: data.type,
      priority: data.priority || this.getPriorityForType(data.type),
      title: `[${roleName.toUpperCase()}] ` + this.getTitleForType(data.type),
      message: data.message,
      applicationId: data.applicationId,
    }));

    if (notifications.length > 0) {
      return this.prisma.notification.createMany({
        data: notifications,
      });
    }
  }

  // Notificar al apoderado que el pago fue cargado
  async notifyPaymentUploaded(userId: string, applicationId: string, studentName: string) {
    return this.create({
      userId,
      type: 'PAYMENT_UPLOADED' as NotificationType,
      priority: 'NORMAL',
      message: `El comprobante de pago de matrícula de ${studentName} fue cargado exitosamente. Secretaría validará el pago próximamente.`,
      applicationId,
    });
  }

  // Notificar al apoderado pago validado
  async notifyPaymentValidated(userId: string, applicationId: string, studentName: string) {
    return this.create({
      userId,
      type: 'PAYMENT_VALIDATED' as NotificationType,
      priority: 'HIGH',
      message: `✅ El pago de matrícula de ${studentName} fue validado. Serás asignado a un paralelo pronto.`,
      applicationId,
    });
  }

  // Notificar al apoderado pago rechazado
  async notifyPaymentRejected(userId: string, applicationId: string, studentName: string, reason?: string) {
    return this.create({
      userId,
      type: 'PAYMENT_REJECTED' as NotificationType,
      priority: 'URGENT',
      message: `❌ El comprobante de pago de ${studentName} fue rechazado${reason ? `: ${reason}` : ''}. Por favor sube un nuevo comprobante.`,
      applicationId,
    });
  }

  // Notificar a secretarios y admins sobre pago cargado
  async notifyAdminStaffPaymentUploaded(applicationId: string, studentName: string) {
    for (const role of ['secretary', 'admin', 'superadmin']) {
      await this.notifyRole(role, {
        type: 'DOCUMENT_REQUIRED' as NotificationType,
        priority: 'HIGH',
        message: `💳 Comprobante de pago cargado para ${studentName}. Requiere validación urgente.`,
        applicationId,
      });
    }
  }

  // Notificar a roles administrativos (ADMIN, SUPERADMIN)
  async notifyAdminRoles(data: {
    type: NotificationType;
    message: string;
    applicationId?: string;
    priority?: NotificationPriority;
  }) {
    for (const role of ['admin', 'superadmin', 'secretary']) {
      await this.notifyRole(role, data);
    }
  }
}

