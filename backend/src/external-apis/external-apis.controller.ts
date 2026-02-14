import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ExternalApisService } from './external-apis.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('external-apis')
@UseGuards(JwtAuthGuard)
export class ExternalApisController {
  constructor(private readonly externalApisService: ExternalApisService) {}

  @Get('cedula/:cedula')
  searchByCedula(@Param('cedula') cedula: string) {
    return this.externalApisService.searchByCedula(cedula);
  }
}
