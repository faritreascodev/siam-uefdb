import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { SystemConfigService } from './system-config.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ModuleAccessGuard } from '../auth/guards/module-access.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ModuleAccess } from '../auth/decorators/module-access.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('system-config')
@ApiBearerAuth('JWT-auth')
@Controller('system-config')
@UseGuards(JwtAuthGuard, RolesGuard, ModuleAccessGuard)
export class SystemConfigController {
    constructor(private readonly configService: SystemConfigService) { }

    @Get()
    @Roles('superadmin', 'admin', 'secretaria')
    @ApiOperation({ summary: 'Get all system configurations' })
    @ModuleAccess('')
    findAll() {
        return this.configService.getAll();
    }

    @Get(':key')
    @Roles('superadmin', 'admin', 'secretaria')
    @ApiOperation({ summary: 'Get config by key' })
    @ModuleAccess('')
    findOne(@Param('key') key: string) {
        return this.configService.get(key);
    }

    @Post(':key')
    @Roles('superadmin', 'admin', 'secretaria')
    @ApiOperation({ summary: 'Update system configuration' })
    @ModuleAccess('configuracion')
    update(
        @Param('key') key: string,
        @Body('value') value: string,
        @Request() req: any
    ) {
        return this.configService.update(key, value, req.user.id);
    }
}


