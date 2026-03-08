import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SystemConfigService implements OnModuleInit {
    constructor(private prisma: PrismaService) { }

    async onModuleInit() {
        // Seed default academic year if not exists
        await this.ensureConfig('CURRENT_ACADEMIC_YEAR', '2026-2027', 'Año lectivo activo para procesos de admisión');
        await this.ensureConfig('ADMISSION_OPEN', 'true', 'Define si el portal de admisiones está recibiendo solicitudes');
        await this.ensureConfig('SECRETARY_MANAGE_USERS', 'false', 'Permite a las secretarias gestionar (crear/editar) usuarios');
        await this.ensureConfig('REQUIRED_DOCUMENTS_NEW', JSON.stringify(['STUDENT_ID', 'REPRESENTATIVE_ID', 'STUDENT_PHOTO', 'GRADE_CERTIFICATE', 'UTILITY_BILL']), 'Documentos requeridos para estudiantes nuevos');
        await this.ensureConfig('REQUIRED_DOCUMENTS_RETURNING', JSON.stringify(['STUDENT_ID', 'REPRESENTATIVE_ID', 'STUDENT_PHOTO']), 'Documentos requeridos para estudiantes antiguos');
        await this.ensureConfig('FORM_CONFIG', JSON.stringify({
            fatherOccupation: true,
            motherOccupation: true,
            fatherCompany: true,
            motherCompany: true,
            showExtraContacts: true
        }), 'Configuración de campos dinámicos para el formulario de admisión');
        await this.ensureConfig('FORM_GRADES', JSON.stringify([
            { value: 'Inicial 1', label: 'Inicial 1 (3 años)', isBGU: false, requiresCursillo: false },
            { value: 'Inicial 2', label: 'Inicial 2 (4 años)', isBGU: false, requiresCursillo: false },
            { value: '1ero EGB', label: '1ro Básico', isBGU: false, requiresCursillo: false },
            { value: '2do EGB', label: '2do Básico', isBGU: false, requiresCursillo: false },
            { value: '3ro EGB', label: '3ro Básico', isBGU: false, requiresCursillo: false },
            { value: '4to EGB', label: '4to Básico', isBGU: false, requiresCursillo: false },
            { value: '5to EGB', label: '5to Básico', isBGU: false, requiresCursillo: false },
            { value: '6to EGB', label: '6to Básico', isBGU: false, requiresCursillo: false },
            { value: '7mo EGB', label: '7mo Básico', isBGU: false, requiresCursillo: false },
            { value: '8vo EGB', label: '8vo Básico', isBGU: false, requiresCursillo: true },
            { value: '9no EGB', label: '9no Básico', isBGU: false, requiresCursillo: false },
            { value: '10mo EGB', label: '10mo Básico', isBGU: false, requiresCursillo: false },
            { value: '1ero BGU', label: '1ro Bachillerato', isBGU: true, requiresCursillo: true },
            { value: '2do BGU', label: '2do Bachillerato', isBGU: true, requiresCursillo: false },
            { value: '3ro BGU', label: '3ro Bachillerato', isBGU: true, requiresCursillo: false }
        ]), 'Grados disponibles para el formulario de admisión');
        await this.ensureConfig('FORM_SPECIALTIES', JSON.stringify([
            { value: 'CIENCIAS', label: 'BGU Ciencias', afternoonOnly: false },
            { value: 'TECNICO_INFORMATICA', label: 'BT Informática', afternoonOnly: true }
        ]), 'Especialidades de bachillerato disponibles');
        await this.ensureConfig('FORM_RELATIONSHIPS', JSON.stringify([
            'Padre', 'Madre', 'Abuelo/a', 'Tío/a', 'Tutor Legal', 'Otro'
        ]), 'Parentescos disponibles en el formulario de datos familiares');
    }

    private async ensureConfig(key: string, defaultValue: string, description: string) {
        const exists = await this.prisma.systemConfig.findUnique({ where: { key } });
        if (!exists) {
            await this.prisma.systemConfig.create({
                data: { key, value: defaultValue, description },
            });
        }
    }

    async get(key: string): Promise<string | null> {
        const config = await this.prisma.systemConfig.findUnique({ where: { key } });
        return config ? config.value : null;
    }

    async getAll() {
        return this.prisma.systemConfig.findMany();
    }

    async update(key: string, value: string, userId?: string) {
        return this.prisma.systemConfig.update({
            where: { key },
            data: {
                value,
                updatedBy: userId
            },
        });
    }
}


