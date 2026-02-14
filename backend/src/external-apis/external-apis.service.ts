import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ExternalApisService {
  private readonly logger = new Logger(ExternalApisService.name);

  constructor(private readonly httpService: HttpService) {}

  async searchByCedula(cedula: string) {
    if (!/^\d{10}$/.test(cedula)) {
       throw new HttpException('La cédula debe tener 10 dígitos', HttpStatus.BAD_REQUEST);
    }

    try {
      const url = `https://api.mltprdj.com/cedruc/v1/search?ced=${cedula}`;
      const { data } = await firstValueFrom(this.httpService.get(url));
      
      // La API retorna algo como: { name: "JUAN PEDRO PEREZ", ... } o similar
      // Adaptar respuesta al formato frontend
      // NOTA: Ajustar mapeo según respuesta real de la API
      
      // Validar si la respuesta es JSON válido o un error de PHP
      if (typeof data !== 'object' || !data.name) {
        // Intentar parsear si viene como texto estilo PHP Array
        // Por ahora, dado el error "Table doesn't exist", asumimos fallo y retornamos null
        this.logger.warn(`API response invalid or DB error for cedula ${cedula}: ${JSON.stringify(data)}`);
        return null;
      }

      return {
        firstName: data.name ? data.name.split(' ').slice(2).join(' ') : '', // Heurística simple
        lastName: data.name ? data.name.split(' ').slice(0, 2).join(' ') : '',
        raw: data
      };
    } catch (error) {
      this.logger.warn(`Error fetching cedula ${cedula}: ${error.message}`);
      // No lanzar error 500 para no bloquear flujo, retornar null
      return null;
    }
  }
}
