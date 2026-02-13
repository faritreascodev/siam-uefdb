// Tipos para el Sistema de Notificaciones

export type NotificationType =
  | 'APPLICATION_SUBMITTED'
  | 'APPLICATION_DRAFT_SAVED'
  | 'CORRECTION_REQUIRED'
  | 'APPLICATION_APPROVED'
  | 'APPLICATION_REJECTED'
  | 'APPLICATION_UNDER_REVIEW'
  | 'DOCUMENT_REQUIRED';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  applicationId?: string;
  application?: {
    id: string;
    studentFirstName: string;
    studentLastName: string;
    status: string;
  };
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface NotificationFilters {
  unread?: boolean;
  limit?: number;
}

// Labels y colores para UI
export const PRIORITY_LABELS: Record<NotificationPriority, string> = {
  LOW: 'Informativo',
  NORMAL: 'Normal',
  HIGH: 'Importante',
  URGENT: 'Urgente',
};

export const PRIORITY_COLORS: Record<NotificationPriority, string> = {
  LOW: 'bg-gray-100 text-gray-600',
  NORMAL: 'bg-blue-100 text-blue-600',
  HIGH: 'bg-orange-100 text-orange-600',
  URGENT: 'bg-red-100 text-red-600',
};
