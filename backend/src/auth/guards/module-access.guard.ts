import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

export const MODULE_KEY = 'module-name';

@Injectable()
export class ModuleAccessGuard implements CanActivate {
    constructor(private reflector: Reflector, private prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredModule = this.reflector.getAllAndOverride<string>(MODULE_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // Si la ruta no especifica un modulo, se permite
        if (!requiredModule) return true;

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // Check si el usuario esta logueado
        if (!user) return false;

        const userRoles = user.roles?.map((r: any) =>
            (typeof r === 'string' ? r : r.name || '').toLowerCase()
        ) || [];

        // Accesos definidos por defecto. El admin tiene todo.
        if (userRoles.includes('superadmin') || userRoles.includes('admin') || userRoles.includes('rector') || userRoles.includes('secretaria')) {
            return true;
        }

        if (userRoles.includes('secretaria')) {
            const config = await this.prisma.systemConfig.findUnique({
                where: { key: 'SECRETARY_MODULES' }
            });

            if (!config) return true; // Si no hay configuracion, asume verdadero

            try {
                const permissions = JSON.parse(config.value);
                if (permissions[requiredModule] === false) {
                    throw new ForbiddenException(`Módulo Desactivado. La Secretaría no tiene autorización para ingresar a ${requiredModule}.`);
                }
            } catch (e) {
                if (e instanceof ForbiddenException) throw e;
                return true;
            }
        }

        // Pasa por defecto al resto (incluye apoderados, pero ellos estan filtrados por RolesGuard despues)
        return true;
    }
}


