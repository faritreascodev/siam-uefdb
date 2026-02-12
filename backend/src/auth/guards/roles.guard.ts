import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    // Normalize user roles (handle string or object with name)
    const userRoles = user.roles?.map((r: any) => 
      (typeof r === 'string' ? r : r.name || '').toLowerCase()
    ) || [];

    const requiredRolesNormalized = requiredRoles.map(r => r.toLowerCase());

    console.log(`[RolesGuard] Method: ${context.getHandler().name}`);
    console.log(`[RolesGuard] User Roles (Raw):`, user.roles);
    console.log(`[RolesGuard] User Roles (Norm):`, userRoles);
    console.log(`[RolesGuard] Required (Norm):`, requiredRolesNormalized);

    const hasRole = requiredRolesNormalized.some((role) => userRoles.includes(role));
    
    if (!hasRole) {
      console.warn(`[RolesGuard] Access Denied for user ${user.email}`);
    }

    return hasRole;
  }
}
