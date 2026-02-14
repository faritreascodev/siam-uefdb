import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InstitutionsService } from './institutions.service';

@Controller('institutions')
@UseGuards(JwtAuthGuard)
export class InstitutionsController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  @Get()
  findAll(@Query('city') city?: string) {
    if (city) {
      return this.institutionsService.findByCity(city);
    }
    return this.institutionsService.findAll();
  }
}
