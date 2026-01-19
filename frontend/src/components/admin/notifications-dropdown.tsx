"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Bell, Check, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { getMyNotifications, getUnreadCount, markAsRead, markAllAsRead } from '@/lib/api-notifications';
import { Notification, PRIORITY_COLORS } from '@/types/notification';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function NotificationsDropdown() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // @ts-ignore
  const token = session?.accessToken || session?.user?.accessToken;

  const loadNotifications = async () => {
    if (!token) return;
    try {
      const [data, count] = await Promise.all([
        getMyNotifications(token, { limit: 10 }),
        getUnreadCount(token),
      ]);
      setNotifications(data);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Poll for notifications every 30 seconds
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [token]);

  // Refresh when opening
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const handleMarkAsRead = async (id: string) => {
    if (!token) return;
    try {
      await markAsRead(token, id);
      // Update local state
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!token) return;
    try {
      await markAllAsRead(token);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 rounded-full bg-red-500 text-white text-xs border-2 border-background"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 md:w-96" align="end">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificaciones</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="text-xs h-7 px-2">
              <Check className="mr-1 h-3 w-3" />
              Marcar todo leído
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No tienes notificaciones
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notification) => (
                <DropdownMenuItem 
                  key={notification.id} 
                  className={`flex flex-col items-start p-3 cursor-pointer focus:bg-accent ${!notification.isRead ? 'bg-muted/30' : ''}`}
                  onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                >
                  <div className="flex w-full justify-between items-start mb-1">
                    <span className={`font-semibold text-sm ${!notification.isRead ? 'text-primary' : ''}`}>
                      {notification.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: es })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                    {notification.message}
                  </p>
                  {notification.priority !== 'NORMAL' && (
                    <Badge variant="outline" className={`text-[10px] h-5 ${PRIORITY_COLORS[notification.priority]}`}>
                      {notification.priority === 'HIGH' ? 'Importante' : notification.priority === 'URGENT' ? 'Urgente' : 'Informativo'}
                    </Badge>
                  )}
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
