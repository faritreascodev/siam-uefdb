import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) { }

  @Get()
  getHello(@Res() res: Response): void {
    const html = this.appService.getHello();
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  @Get('health')
  getHealth() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'Academic System API',
    };
  }

  @Get('public-config')
  async getPublicConfig() {
    const configs = await this.prisma.systemConfig.findMany({
      where: {
        key: {
          in: ['ADMISSION_OPEN', 'CURRENT_ACADEMIC_YEAR', 'REQUIRED_DOCUMENTS_NEW', 'REQUIRED_DOCUMENTS_RETURNING', 'FORM_CONFIG', 'FORM_GRADES', 'FORM_SPECIALTIES', 'FORM_RELATIONSHIPS']
        }
      }
    });
    const configMap: Record<string, string> = {};
    for (const c of configs) {
      configMap[c.key] = c.value;
    }
    return configMap;
  }
}


