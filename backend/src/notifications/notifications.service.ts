import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType, NotificationPriority } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  // Títulos predefinidos por tipo
  private getTitleForType(type: NotificationType): string {
    const titles: Record<NotificationType, string> = {
      APPLICATION_SUBMITTED: 'Solicitud Enviada',
      APPLICATION_DRAFT_SAVED: 'Borrador Guardado',
      CORRECTION_REQUIRED: 'Corrección Requerida',
      APPLICATION_APPROVED: '¡Solicitud Aprobada!',
      APPLICATION_REJECTED: 'Solicitud Rechazada',
      APPLICATION_UNDER_REVIEW: 'Solicitud en Revisión',
      DOCUMENT_REQUIRED: 'Documento Requerido',
    };
    return titles[type] || 'Nueva Notificación';
  }

  // Prioridad predefinida por tipo
  private getPriorityForType(type: NotificationType): NotificationPriority {
    const priorities: Record<NotificationType, NotificationPriority> = {
      APPLICATION_SUBMITTED: 'NORMAL',
      APPLICATION_DRAFT_SAVED: 'LOW',
      CORRECTION_REQUIRED: 'HIGH',
      APPLICATION_APPROVED: 'NORMAL',
      APPLICATION_REJECTED: 'URGENT',
      APPLICATION_UNDER_REVIEW: 'NORMAL',
      DOCUMENT_REQUIRED: 'HIGH',
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
    const messages: Record<NotificationType, string> = {
      APPLICATION_SUBMITTED: `La solicitud de ${studentName} ha sido enviada correctamente`,
      APPLICATION_DRAFT_SAVED: `Borrador de ${studentName} guardado`,
      CORRECTION_REQUIRED: `La solicitud de ${studentName} necesita correcciones${additionalInfo ? `: ${additionalInfo}` : ''}`,
      APPLICATION_APPROVED: `¡Felicidades! La solicitud de ${studentName} ha sido aprobada`,
      APPLICATION_REJECTED: `La solicitud de ${studentName} no fue aprobada${additionalInfo ? `: ${additionalInfo}` : ''}`,
      APPLICATION_UNDER_REVIEW: `La solicitud de ${studentName} está siendo evaluada`,
      DOCUMENT_REQUIRED: `Falta un documento en la solicitud de ${studentName}`,
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
}
