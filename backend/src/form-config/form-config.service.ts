import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFormFieldConfigDto, UpdateFormFieldConfigDto } from './dto/form-config.dto';

@Injectable()
export class FormConfigService implements OnModuleInit {
    constructor(private prisma: PrismaService) { }

    async onModuleInit() {
        // Seed default form field configurations if not exists
        await this.seedDefaultConfigs();
    }

    private async seedDefaultConfigs() {
        const defaultConfigs = [
            // Grados académicos
            {
                fieldKey: 'gradeLevel',
                fieldType: 'select',
                label: 'Grado a Postular',
                section: 'academic',
                options: JSON.stringify([
                    { value: '8vo EGB', label: '8vo Año de Educación General Básica' },
                    { value: '9no EGB', label: '9no Año de Educación General Básica' },
                    { value: '10mo EGB', label: '10mo Año de Educación General Básica' },
                    { value: '1ero BGU', label: '1ero de Bachillerato General Unificado' },
                    { value: '2do BGU', label: '2do de Bachillerato General Unificado' },
                    { value: '3ro BGU', label: '3ro de Bachillerato General Unificado' },
                ]),
                isRequired: true,
                isEnabled: true,
                displayOrder: 1,
                placeholder: 'Seleccione el grado',
                helpText: 'Seleccione el grado al que desea postular su hijo/a',
            },
            // Especialidades (para Bachillerato)
            {
                fieldKey: 'specialty',
                fieldType: 'select',
                label: 'Especialidad (Solo Bachillerato)',
                section: 'academic',
                options: JSON.stringify([
                    { value: 'Informática', label: 'Informática' },
                    { value: 'Electromecánica', label: 'Electromecánica' },
                    { value: 'Electricidad', label: 'Electricidad' },
                    { value: 'Mecánica Industrial', label: 'Mecánica Industrial' },
                ]),
                isRequired: false, // Solo requerido para BGU
                isEnabled: true,
                displayOrder: 3,
                placeholder: 'Seleccione especialidad',
                helpText: 'Solo aplica para Bachillerato General Unificado',
            },
            // Jornada
            {
                fieldKey: 'shift',
                fieldType: 'select',
                label: 'Jornada',
                section: 'academic',
                options: JSON.stringify([
                    { value: 'MORNING', label: 'Matutina' },
                    { value: 'AFTERNOON', label: 'Vespertina' },
                ]),
                isRequired: true,
                isEnabled: true,
                displayOrder: 2,
                placeholder: 'Seleccione jornada',
                helpText: 'Horario en el que desea matricular a su hijo/a',
            },
            // Parentesco del representante
            {
                fieldKey: 'representativeRelationship',
                fieldType: 'select',
                label: 'Parentesco con el Estudiante',
                section: 'family',
                options: JSON.stringify([
                    { value: 'Padre', label: 'Padre' },
                    { value: 'Madre', label: 'Madre' },
                    { value: 'Abuelo/a', label: 'Abuelo/a' },
                    { value: 'Tío/a', label: 'Tío/a' },
                    { value: 'Tutor Legal', label: 'Tutor Legal' },
                    { value: 'Otro', label: 'Otro' },
                ]),
                isRequired: true,
                isEnabled: true,
                displayOrder: 1,
                placeholder: 'Seleccione parentesco',
                helpText: 'Relación del representante con el estudiante',
            },
            // Tipo de sangre
            {
                fieldKey: 'bloodType',
                fieldType: 'select',
                label: 'Tipo de Sangre',
                section: 'health',
                options: JSON.stringify([
                    { value: 'A+', label: 'A+' },
                    { value: 'A-', label: 'A-' },
                    { value: 'B+', label: 'B+' },
                    { value: 'B-', label: 'B-' },
                    { value: 'AB+', label: 'AB+' },
                    { value: 'AB-', label: 'AB-' },
                    { value: 'O+', label: 'O+' },
                    { value: 'O-', label: 'O-' },
                ]),
                isRequired: false,
                isEnabled: true,
                displayOrder: 1,
                placeholder: 'Seleccione tipo de sangre',
                helpText: 'Tipo de sangre del estudiante',
            },
            // Género
            {
                fieldKey: 'studentGender',
                fieldType: 'select',
                label: 'Género',
                section: 'student',
                options: JSON.stringify([
                    { value: 'M', label: 'Masculino' },
                    { value: 'F', label: 'Femenino' },
                    { value: 'OTHER', label: 'Otro' },
                ]),
                isRequired: true,
                isEnabled: true,
                displayOrder: 5,
                placeholder: 'Seleccione género',
                helpText: 'Género del estudiante',
            },
            // Campos de texto simples
            {
                fieldKey: 'previousSchool',
                fieldType: 'text',
                label: 'Institución de Procedencia',
                section: 'academic',
                isRequired: false,
                isEnabled: true,
                displayOrder: 4,
                placeholder: 'Nombre del colegio anterior',
                helpText: 'Institución educativa de la que proviene el estudiante',
            },
            {
                fieldKey: 'studentNationality',
                fieldType: 'text',
                label: 'Nacionalidad',
                section: 'student',
                isRequired: false,
                isEnabled: true,
                displayOrder: 6,
                placeholder: 'Ej: Ecuatoriana',
                helpText: 'Nacionalidad del estudiante',
            },
        ];

        for (const config of defaultConfigs) {
            const exists = await this.prisma.formFieldConfig.findUnique({
                where: { fieldKey: config.fieldKey }
            });
            if (!exists) {
                await this.prisma.formFieldConfig.create({ data: config });
            }
        }
    }

    async findAll() {
        return this.prisma.formFieldConfig.findMany({
            orderBy: [
                { section: 'asc' },
                { displayOrder: 'asc' },
            ],
        });
    }

    async findBySection(section: string) {
        return this.prisma.formFieldConfig.findMany({
            where: { section, isEnabled: true },
            orderBy: { displayOrder: 'asc' },
        });
    }

    async findOne(id: string) {
        return this.prisma.formFieldConfig.findUnique({ where: { id } });
    }

    async findByKey(fieldKey: string) {
        return this.prisma.formFieldConfig.findUnique({ where: { fieldKey } });
    }

    async create(dto: CreateFormFieldConfigDto, userId?: string) {
        return this.prisma.formFieldConfig.create({
            data: {
                ...dto,
                options: dto.options ? JSON.stringify(dto.options) : null,
                validationRules: dto.validationRules ? JSON.stringify(dto.validationRules) : null,
                updatedBy: userId,
            },
        });
    }

    async update(id: string, dto: UpdateFormFieldConfigDto, userId?: string) {
        return this.prisma.formFieldConfig.update({
            where: { id },
            data: {
                ...dto,
                options: dto.options ? JSON.stringify(dto.options) : undefined,
                validationRules: dto.validationRules ? JSON.stringify(dto.validationRules) : undefined,
                updatedBy: userId,
            },
        });
    }

    async updateOptions(fieldKey: string, options: any[], userId?: string) {
        return this.prisma.formFieldConfig.update({
            where: { fieldKey },
            data: {
                options: JSON.stringify(options),
                updatedBy: userId,
            },
        });
    }

    async toggleEnabled(id: string, isEnabled: boolean, userId?: string) {
        return this.prisma.formFieldConfig.update({
            where: { id },
            data: { isEnabled, updatedBy: userId },
        });
    }

    async remove(id: string) {
        return this.prisma.formFieldConfig.delete({ where: { id } });
    }

    // Get all enabled fields grouped by section
    async getEnabledFieldsBySection() {
        const fields = await this.prisma.formFieldConfig.findMany({
            where: { isEnabled: true },
            orderBy: [
                { section: 'asc' },
                { displayOrder: 'asc' },
            ],
        });

        const grouped = fields.reduce((acc, field) => {
            if (!acc[field.section]) {
                acc[field.section] = [];
            }
            acc[field.section].push(field);
            return acc;
        }, {} as Record<string, any[]>);

        return grouped;
    }
}


