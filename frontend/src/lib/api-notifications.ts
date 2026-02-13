import { Notification, NotificationFilters } from '@/types/notification';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';

// Obtener mis notificaciones
export async function getMyNotifications(
  token: string,
  filters?: NotificationFilters
): Promise<Notification[]> {
  const params = new URLSearchParams();
  if (filters?.unread !== undefined) params.append('unread', filters.unread.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const res = await fetch(`${API_URL}/notifications?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error('Error al obtener notificaciones');
  return res.json();
}

// Obtener conteo de no leídas
export async function getUnreadCount(token: string): Promise<number> {
  const res = await fetch(`${API_URL}/notifications/unread-count`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error('Error al obtener conteo');
  return res.json();
}

// Marcar como leída
export async function markAsRead(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_URL}/notifications/${id}/read`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error('Error al marcar como leída');
}

// Marcar todas como leídas
export async function markAllAsRead(token: string): Promise<void> {
  const res = await fetch(`${API_URL}/notifications/read-all`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error('Error al marcar todas como leídas');
}
