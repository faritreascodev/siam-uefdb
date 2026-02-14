import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { QuotasService } from './quotas.service';
import { CreateQuotaDto } from './dto/create-quota.dto';
import { UpdateQuotaDto } from './dto/update-quota.dto';

@ApiTags('quotas')
@ApiBearerAuth('JWT-auth')
@Controller('quotas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuotasController {
  constructor(private readonly quotasService: QuotasService) {}

  @Post()
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Create a new quota configuration' })
  create(@Body() createQuotaDto: CreateQuotaDto) {
    return this.quotasService.create(createQuotaDto);
  }

  @Get()
  @Roles('superadmin', 'admin', 'secretary', 'principal')
  @ApiOperation({ summary: 'Get all quota configurations' })
  findAll() {
    return this.quotasService.findAll();
  }

  @Get('seed')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Seed initial quota data' })
  seed() {
    return this.quotasService.seed();
  }

  @Get('check-availability')
  // Public or User accessible? Usually User when applying.
  // We keep it protected but accessible to all roles or just basic user?
  // Ideally authenticated.
  checkAvailability(
    @Query('gradeLevel') gradeLevel: string,
    @Query('shift') shift: string,
    @Query('specialty') specialty?: string,
  ) {
    if (!gradeLevel || !shift) {
      return {
        error: 'gradeLevel and shift are required parameters',
      };
    }

    // Call service which returns Promise now
    return this.quotasService.checkAvailability(gradeLevel, shift, specialty)
      .then(availability => {
         const requiresCursillo = this.quotasService.requiresCursillo(gradeLevel);
         return {
           ...availability,
           requiresCursillo,
         };
      });
  }

  @Get(':id')
  @Roles('superadmin', 'admin', 'secretary')
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
