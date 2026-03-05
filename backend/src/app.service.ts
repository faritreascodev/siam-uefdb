import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Bienvenido a la API del Sistema Academico (SIAM UEFDB).\\n\\nLa documentacion esta disponible en: /api/docs';
  }
}
