import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // Obtener mis notificaciones
  @Get()
  findMyNotifications(
    @Request() req: any,
    @Query('unread') unread?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.findByUser(req.user.sub, {
      isRead: unread === 'true' ? false : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  // Obtener conteo de no leídas
  @Get('unread-count')
  getUnreadCount(@Request() req: any) {
    return this.notificationsService.getUnreadCount(req.user.sub);
  }

  // Marcar una como leída
  @Post(':id/read')
  markAsRead(@Param('id') id: string, @Request() req: any) {
    return this.notificationsService.markAsRead(id, req.user.sub);
  }

  // Marcar todas como leídas
  @Post('read-all')
  markAllAsRead(@Request() req: any) {
    return this.notificationsService.markAllAsRead(req.user.sub);
  }
}
