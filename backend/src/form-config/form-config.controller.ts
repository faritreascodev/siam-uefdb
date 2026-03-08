import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
    Query,
} from '@nestjs/common';
import { FormConfigService } from './form-config.service';
import {
    CreateFormFieldConfigDto,
    UpdateFormFieldConfigDto,
    UpdateFieldOptionsDto,
} from './dto/form-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ModuleAccessGuard } from '../auth/guards/module-access.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ModuleAccess } from '../auth/decorators/module-access.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('form-config')
@ApiBearerAuth('JWT-auth')
@Controller('form-config')
@UseGuards(JwtAuthGuard, RolesGuard, ModuleAccessGuard)
export class FormConfigController {
    constructor(private readonly formConfigService: FormConfigService) { }

    @Get()
    @Roles('superadmin', 'admin', 'secretaria')
    @ModuleAccess('configuracion')
    @ApiOperation({ summary: 'Get all form field configurations' })
    findAll() {
        return this.formConfigService.findAll();
    }

    @Get('public')
    @ModuleAccess('')
    @ApiOperation({ summary: 'Get enabled form fields (public for form rendering)' })
    getPublicFields() {
        return this.formConfigService.getEnabledFieldsBySection();
    }

    @Get('section/:section')
    @Roles('superadmin', 'admin', 'secretaria')
    @ModuleAccess('configuracion')
    @ApiOperation({ summary: 'Get form fields by section' })
    findBySection(@Param('section') section: string) {
        return this.formConfigService.findBySection(section);
    }

    @Get(':id')
    @Roles('superadmin', 'admin')
    @ModuleAccess('configuracion')
    @ApiOperation({ summary: 'Get form field config by ID' })
    findOne(@Param('id') id: string) {
        return this.formConfigService.findOne(id);
    }

    @Post()
    @Roles('superadmin', 'admin')
    @ModuleAccess('configuracion')
    @ApiOperation({ summary: 'Create new form field configuration' })
    create(@Body() dto: CreateFormFieldConfigDto, @Request() req: any) {
        return this.formConfigService.create(dto, req.user.id);
    }

    @Put(':id')
    @Roles('superadmin', 'admin')
    @ModuleAccess('configuracion')
    @ApiOperation({ summary: 'Update form field configuration' })
    update(
        @Param('id') id: string,
        @Body() dto: UpdateFormFieldConfigDto,
        @Request() req: any
    ) {
        return this.formConfigService.update(id, dto, req.user.id);
    }

    @Put(':id/toggle')
    @Roles('superadmin', 'admin')
    @ModuleAccess('configuracion')
    @ApiOperation({ summary: 'Toggle field enabled/disabled' })
    toggleEnabled(
        @Param('id') id: string,
        @Body('isEnabled') isEnabled: boolean,
        @Request() req: any
    ) {
        return this.formConfigService.toggleEnabled(id, isEnabled, req.user.id);
    }

    @Put('key/:fieldKey/options')
    @Roles('superadmin', 'admin')
    @ModuleAccess('configuracion')
    @ApiOperation({ summary: 'Update field options (for select/radio fields)' })
    updateOptions(
        @Param('fieldKey') fieldKey: string,
        @Body() dto: UpdateFieldOptionsDto,
        @Request() req: any
    ) {
        return this.formConfigService.updateOptions(fieldKey, dto.options, req.user.id);
    }

    @Delete(':id')
    @Roles('superadmin', 'admin')
    @ModuleAccess('configuracion')
    @ApiOperation({ summary: 'Delete form field configuration' })
    remove(@Param('id') id: string) {
        return this.formConfigService.remove(id);
    }
}


