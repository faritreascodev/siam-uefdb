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
