import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { PrismaService } from './src/prisma/prisma.service';
import { AcademicStatus } from '@prisma/client';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const prisma = app.get(PrismaService);

    console.log('Inserting test data...');

    const cedula = '0999999999';

    await prisma.academicRecord.upsert({
        where: {
            studentCedula_academicYear: {
                studentCedula: cedula,
                academicYear: '2025-2026',
            },
        },
        update: {
            status: 'FAILED_YEAR', // Reprobado
        },
        create: {
            studentCedula: cedula,
            academicYear: '2025-2026',
            gradeLevel: '1ero BGU',
            status: 'FAILED_YEAR',
        },
    });

    console.log('Test data created. Cedula: 0999999999, Status: FAILED_YEAR');

    await app.close();
}

bootstrap();
