import { Injectable } from '@nestjs/common';

// Lista de instituciones educativas del Ecuador
const INSTITUTIONS = [
  { id: '1', name: 'Unidad Educativa Fiscal Don Bosco', city: 'Quito', type: 'FISCAL' },
  { id: '2', name: 'Colegio Mejía', city: 'Quito', type: 'FISCAL' },
  { id: '3', name: 'Colegio 24 de Mayo', city: 'Quito', type: 'FISCAL' },
  { id: '4', name: 'Colegio Montúfar', city: 'Quito', type: 'FISCAL' },
  { id: '5', name: 'Unidad Educativa San Francisco de Quito', city: 'Quito', type: 'PARTICULAR' },
  { id: '6', name: 'Unidad Educativa Tomás Moro', city: 'Quito', type: 'PARTICULAR' },
  { id: '7', name: 'Unidad Educativa Sep', city: 'Quito', type: 'PARTICULAR' },
  { id: '8', name: 'Colegio Alemán de Quito', city: 'Quito', type: 'PARTICULAR' },
  { id: '9', name: 'Colegio Americano de Quito', city: 'Quito', type: 'PARTICULAR' },
  { id: '10', name: 'Unidad Educativa Liceo Naval', city: 'Guayaquil', type: 'FISCOMISIONAL' },
  { id: '11', name: 'Colegio Cristóbal Colón', city: 'Guayaquil', type: 'FISCAL' },
  { id: '12', name: 'Unidad Educativa Vicente Rocafuerte', city: 'Guayaquil', type: 'FISCAL' },
  { id: '13', name: 'Unidad Educativa Particular Javier', city: 'Guayaquil', type: 'FISCOMISIONAL' },
  { id: '14', name: 'Colegio La Salle', city: 'Cuenca', type: 'FISCOMISIONAL' },
  { id: '15', name: 'Unidad Educativa Corazón de María', city: 'Cuenca', type: 'PARTICULAR' },
  { id: '16', name: 'Colegio Benigno Malo', city: 'Cuenca', type: 'FISCAL' },
  { id: '17', name: 'Unidad Educativa Sudamericano', city: 'Cuenca', type: 'PARTICULAR' },
  { id: '18', name: 'Unidad Educativa PCEI', city: 'Quito', type: 'FISCAL' },
  { id: '19', name: 'Unidad Educativa Particular Liceo Los Andes', city: 'Quito', type: 'PARTICULAR' },
  { id: '20', name: 'Otro (especificar)', city: 'N/A', type: 'OTHER' },
];

@Injectable()
export class InstitutionsService {
  findAll() {
    return INSTITUTIONS;
  }

  findByCity(city: string) {
    return INSTITUTIONS.filter(
      (inst) => inst.city.toLowerCase() === city.toLowerCase() || inst.type === 'OTHER',
    );
  }

  findById(id: string) {
    return INSTITUTIONS.find((inst) => inst.id === id);
  }
}
