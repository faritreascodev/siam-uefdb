import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SecretaryManageUsersGuard implements CanActivate {
    constructor(private prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) return false;

        const roles = user.roles?.map((r: any) => (typeof r === 'string' ? r : r.name || '').toLowerCase()) || [];

        if (roles.includes('admin') || roles.includes('superadmin') || roles.includes('rector') || roles.includes('directivo')) {
            return true;
        }

        if (roles.includes('secretaria')) {
            const config = await this.prisma.systemConfig.findUnique({ where: { key: 'SECRETARY_MANAGE_USERS' } });
            if (config?.value === 'true') {
                return true;
            }
            throw new ForbiddenException('La configuración actual no permite a las secretarías gestionar usuarios.');
        }

        throw new ForbiddenException('No tienes los permisos necesarios para realizar esta acción.');
    }
}


