import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ModuleAccessGuard } from '../auth/guards/module-access.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ModuleAccess } from '../auth/decorators/module-access.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { QuotasService } from './quotas.service';
import { CreateQuotaDto } from './dto/create-quota.dto';
import { UpdateQuotaDto } from './dto/update-quota.dto';

@ApiTags('quotas')
@ApiBearerAuth('JWT-auth')
@Controller('quotas')
@UseGuards(JwtAuthGuard, RolesGuard, ModuleAccessGuard)
@ModuleAccess('cupos')
export class QuotasController {
  constructor(private readonly quotasService: QuotasService) { }

  @Post()
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Create a new quota configuration' })
  create(@Body() createQuotaDto: CreateQuotaDto) {
    return this.quotasService.create(createQuotaDto);
  }

  @Get()
  @Roles('superadmin', 'admin', 'secretaria', 'rector')
  @ApiOperation({ summary: 'Get all quota configurations' })
  findAll() {
    return this.quotasService.findAll();
  }

  @Get('seed')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Seed initial quota data' })
  @ModuleAccess('') // override to allow seed for admin only, though it's already protected
  seed() {
    return this.quotasService.seed();
  }

  @Get('check-availability')
  @ModuleAccess('') // override so anyone can check
  checkAvailability(
    @Query('gradeLevel') gradeLevel: string,
    @Query('shift') shift: string,
    @Query('specialty') specialty?: string,
    @Query('previousSchool') previousSchool?: string,
  ) {
    if (!gradeLevel || !shift) {
      return {
        error: 'gradeLevel and shift are required parameters',
      };
    }

    // Call service which returns Promise now
    return this.quotasService.checkAvailability(gradeLevel, shift, specialty)
      .then(availability => {
        const requiresCursillo = this.quotasService.requiresCursillo(gradeLevel, previousSchool);
        return {
          ...availability,
          requiresCursillo,
        };
      });
  }

  @Get(':id')
  @Roles('superadmin', 'admin', 'secretaria')
  @ApiOperation({ summary: 'Get a quota configuration by ID' })
  findOne(@Param('id') id: string) {
    return this.quotasService.findOne(id);
  }

  @Patch(':id')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Update a quota configuration' })
  update(@Param('id') id: string, @Body() updateQuotaDto: UpdateQuotaDto) {
    return this.quotasService.update(id, updateQuotaDto);
  }

  @Delete(':id')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Delete a quota configuration' })
  remove(@Param('id') id: string) {
    return this.quotasService.remove(id);
  }
}


