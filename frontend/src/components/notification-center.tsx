'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { getMyNotifications, markAsRead, markAllAsRead, getUnreadCount } from '@/lib/api-notifications';
import { Notification, PRIORITY_COLORS } from '@/types/notification';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function NotificationCenter() {
  const { data: session } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');
  const [loading, setLoading] = useState(false);

  // @ts-ignore - accessToken is added in next-auth callbacks
  const accessToken = session?.accessToken || session?.user?.accessToken;

  const loadNotifications = useCallback(async () => {
    if (!accessToken) return;
    
    setLoading(true);
    try {
      const [notifs, count] = await Promise.all([
        getMyNotifications(accessToken),
        getUnreadCount(accessToken),
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadNotifications();
    // Polling cada 30 segundos
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    // @ts-ignore
    const token = session?.accessToken || session?.user?.accessToken;
    if (!token) return;
    
    try {
      await markAsRead(token as string, notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    // @ts-ignore
    const token = session?.accessToken || session?.user?.accessToken;
    if (!token) return;
    
    try {
      await markAllAsRead(token as string);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    if (notification.applicationId) {
      router.push(`/apoderado/solicitudes/${notification.applicationId}`);
      setIsOpen(false);
    }
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-full sm:w-[400px] p-0">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle>Notificaciones</SheetTitle>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleMarkAllAsRead}
              >
                Marcar todas como leídas
              </Button>
            )}
          </div>
          
          {/* Filtros */}
          <div className="flex gap-2 mt-4">
            <Button 
              variant={filter === 'all' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Todas ({notifications.length})
            </Button>
            <Button 
              variant={filter === 'unread' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('unread')}
            >
              No leídas ({unreadCount})
            </Button>
          </div>
        </SheetHeader>
        
        <div className="overflow-y-auto h-[calc(100vh-160px)]">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Bell className="h-12 w-12 mb-2 opacity-20" />
              <p>No hay notificaciones {filter === 'unread' ? 'sin leer' : ''}</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredNotifications.map(notification => (
                <NotificationItem 
                  key={notification.id} 
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                />
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function NotificationItem({ 
  notification,
  onClick, 
}: { 
  notification: Notification;
  onClick: () => void;
}) {
  return (
    <div 
      className={cn(
        "p-4 cursor-pointer hover:bg-accent transition-colors",
        !notification.isRead && "bg-blue-50/50"
      )}
      onClick={onClick}
    >
      <div className="flex gap-3">
        <div className={cn(
          "h-2 w-2 rounded-full mt-2 flex-shrink-0",
          !notification.isRead ? "bg-blue-600" : "bg-gray-300"
        )} />
        
        <div className="flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <p className={cn(
              "font-medium text-sm",
              !notification.isRead && "text-foreground"
            )}>
              {notification.title}
            </p>
            <Badge 
              variant="outline" 
              className={cn("text-xs", PRIORITY_COLORS[notification.priority])}
            >
              {notification.priority}
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2">
            {notification.message}
          </p>
          
          {notification.application && (
            <p className="text-xs text-muted-foreground">
              Estudiante: {notification.application.studentFirstName} {notification.application.studentLastName}
            </p>
          )}
          
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.createdAt), { 
              addSuffix: true,
              locale: es 
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
