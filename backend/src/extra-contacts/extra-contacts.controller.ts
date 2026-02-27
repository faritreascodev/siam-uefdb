import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ExtraContactsService } from './extra-contacts.service';
import { CreateExtraContactDto } from './dto/create-extra-contact.dto';
import { UpdateExtraContactDto } from './dto/update-extra-contact.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('extra-contacts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('extra-contacts')
export class ExtraContactsController {
  constructor(private readonly extraContactsService: ExtraContactsService) {}

  @Post()
  @Roles('apoderado', 'secretary', 'admin', 'principal', 'superadmin')
  @ApiOperation({ summary: 'Creates a new extra contact for a student application (Max 3)' })
  create(@Body() createExtraContactDto: CreateExtraContactDto) {
    return this.extraContactsService.create(createExtraContactDto);
  }

  @Get('application/:applicationId')
  @Roles('apoderado', 'secretary', 'admin', 'principal', 'superadmin')
  @ApiOperation({ summary: 'Gets all extra contacts for a specific application' })
  findAllByApplication(@Param('applicationId') applicationId: string) {
    return this.extraContactsService.findAllByApplication(applicationId);
  }

  @Get(':id')
  @Roles('apoderado', 'secretary', 'admin', 'principal', 'superadmin')
  @ApiOperation({ summary: 'Gets a specific extra contact by ID' })
  findOne(@Param('id') id: string) {
    return this.extraContactsService.findOne(id);
  }

  @Patch(':id')
  @Roles('apoderado', 'secretary', 'admin', 'principal', 'superadmin')
  @ApiOperation({ summary: 'Updates an existing extra contact' })
  update(@Param('id') id: string, @Body() updateExtraContactDto: UpdateExtraContactDto) {
    return this.extraContactsService.update(id, updateExtraContactDto);
  }

  @Delete(':id')
  @Roles('apoderado', 'secretary', 'admin', 'principal', 'superadmin')
  @ApiOperation({ summary: 'Deletes an extra contact' })
  remove(@Param('id') id: string) {
    return this.extraContactsService.remove(id);
  }
}
