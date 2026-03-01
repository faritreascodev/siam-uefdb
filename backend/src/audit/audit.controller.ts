import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ModuleAccessGuard } from '../auth/guards/module-access.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ModuleAccess } from '../auth/decorators/module-access.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('audit')
@ApiBearerAuth('JWT-auth')
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard, ModuleAccessGuard)
@ModuleAccess('auditoria')
export class AuditController {
    constructor(private readonly auditService: AuditService) { }

    @Get()
    @Roles('superadmin', 'admin', 'secretary')
    @ApiOperation({ summary: 'Get all audit logs' })
    findAll(
        @Query('action') action?: string,
        @Query('entity') entity?: string,
        @Query('userId') userId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.auditService.findAll({
            action,
            entity,
            userId,
            startDate,
            endDate,
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
        });
    }
}
