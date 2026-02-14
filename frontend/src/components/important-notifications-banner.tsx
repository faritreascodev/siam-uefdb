'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getMyNotifications } from '@/lib/api-notifications';
import { Notification } from '@/types/notification';
import Link from 'next/link';

export function ImportantNotificationsBanner() {
  const { data: session } = useSession();
  const [urgentNotifications, setUrgentNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    async function loadUrgent() {
      // @ts-ignore - accessToken is added in next-auth callbacks
      const token = session?.accessToken || session?.user?.accessToken;
      if (!token) return;
      
      try {
        const notifs = await getMyNotifications(token as string, { unread: true });
        const urgent = notifs.filter(
          n => !n.isRead && (n.priority === 'URGENT' || n.priority === 'HIGH')
        );
        setUrgentNotifications(urgent);
      } catch (error) {
        console.error('Error loading urgent notifications:', error);
      }
    }

    loadUrgent();
  }, [session]);

  if (urgentNotifications.length === 0) return null;

  return (
    <Alert variant="destructive" className="border-orange-400 bg-orange-50 text-orange-800">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>
        Tienes {urgentNotifications.length} notificación(es) importante(s)
      </AlertTitle>
      <AlertDescription className="mt-1">
        {urgentNotifications[0].message}
        {urgentNotifications.length > 1 && (
          <span className="ml-1">y {urgentNotifications.length - 1} más...</span>
        )}
        {urgentNotifications[0].applicationId && (
          <Link 
            href={`/apoderado/solicitudes/${urgentNotifications[0].applicationId}`}
            className="ml-2 underline font-medium"
          >
            Ver solicitud
          </Link>
        )}
      </AlertDescription>
    </Alert>
  );
}
