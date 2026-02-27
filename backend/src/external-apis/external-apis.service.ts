import { Injectable, Logger, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
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
      
      // Validar si la respuesta tiene la estructura esperada
      // La API retorna: { nombre, fechaNacimiento, genero, nacionalidad, ... }
      if (typeof data !== 'object' || !data.nombre) {
        this.logger.warn(`API response invalid or data not found for cedula ${cedula}: ${JSON.stringify(data)}`);
        // Si la API no retorna datos válidos, lanzamos NotFound para que el controller retorne 404
        throw new NotFoundException(`No se encontraron datos para la cédula ${cedula}`);
      }

      // Parsear nombre: APELLIDO1 APELLIDO2 NOMBRE1 NOMBRE2 ...
      const parts = data.nombre.split(' ');
      const lastName = parts.slice(0, 2).join(' ');
      const firstName = parts.slice(2).join(' ');

      // Parsear fecha nacimiento: 10/03/1992 -> 1992-03-10
      let birthDate = '';
      if (data.fechaNacimiento) {
        const [day, month, year] = data.fechaNacimiento.split('/');
        if (day && month && year) {
          birthDate = `${year}-${month}-${day}`;
        }
      }

      // Mapear género
      let gender = '';
      if (data.genero === 'HOMBRE') gender = 'M';
      else if (data.genero === 'MUJER') gender = 'F';

      // Lugar de nacimiento (ESMERALDAS/ESMERALDAS/ESMERALDAS) -> Provincia/Canton/Parroquia
      // No mapeamos directamente porque LocationSelector usa IDs, pero podemos pasar el string raw si es útil
      // O intentar parsear si el frontend lo soporta. Por ahora devolvemos lo básico.

      return {
        firstName: firstName,
        lastName: lastName,
        birthDate: birthDate,
        gender: gender,
        nationality: data.nacionalidad || '',
        address: `${data.lugarDomicilio || ''} ${data.calleDomicilio || ''}`.trim(),
        raw: data
      };
    } catch (error) {
      this.logger.warn(`Error fetching cedula ${cedula}: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      // Retornar null o lanzar NotFound si falla la conexión
      throw new NotFoundException('Error al consultar datos externos');
    }
  }
}
