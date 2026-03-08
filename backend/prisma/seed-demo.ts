import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Seed: Loading demo students...');

    const demoCedulas = [
        { cedula: '0103957284', firstName: 'Homero', lastName: 'Velastegui', email: 'homero.velastegui@example.com' },
        { cedula: '0208415937', firstName: 'Pedro', lastName: 'Perez', email: 'pedro.perez@example.com' },
        { cedula: '1702849365', firstName: 'Maria', lastName: 'Garcia', email: 'maria.garcia@example.com' },
        { cedula: '1004597132', firstName: 'Juan', lastName: 'Castro', email: 'juan.castro@example.com' },
        { cedula: '0907314289', firstName: 'Ana', lastName: 'Martinez', email: 'ana.martinez@example.com' },
    ];

    const defaultPassword = await bcrypt.hash('Demo123!', 10);

    for (const student of demoCedulas) {
        // 1. Create or get user
        const user = await prisma.user.upsert({
            where: { email: student.email },
            update: {},
            create: {
                email: student.email,
                password: defaultPassword,
                firstName: student.firstName,
                lastName: student.lastName,
                cedula: student.cedula,
                status: 'ACTIVO',
                isActive: true,
            }
        });

        // 2. Ensure role 'apoderado'
        const role = await prisma.role.findUnique({ where: { name: 'apoderado' } });
        if (role) {
            await prisma.userRole.upsert({
                where: { userId_roleId: { userId: user.id, roleId: role.id } },
                update: {},
                create: { userId: user.id, roleId: role.id }
            });
        }

        // 3. Create academic record (PASSED)
        await prisma.academicRecord.upsert({
            where: { id: `demo-record-${student.cedula}` }, // We don't have a unique constraint on ID but let's be safe
            update: {
                status: 'PASSED',
                finalAverage: 10.0,
            },
            create: {
                id: `demo-record-${student.cedula}`,
                studentCedula: student.cedula,
                academicYear: '2024-2025',
                gradeLevel: '7mo EGB',
                status: 'PASSED',
                finalAverage: 10.0,
            }
        }).catch(e => console.log(`Record for ${student.cedula} already exists or error: ${e.message}`));

        // 4. Create a previous application to fetch names/data during search
        const oldApp = await prisma.application.create({
            data: {
                userId: user.id,
                studentCedula: student.cedula,
                studentFirstName: student.firstName,
                studentLastName: student.lastName,
                studentGender: 'M',
                studentNationality: 'ECUATORIANA',
                studentAddress: 'Av. Demo 123, Ciudad de Prueba',
                studentPhone: '0999999999',
                studentEmail: student.email,
                enrollmentType: 'RETURNING_STUDENT',
                status: 'MATRICULATED',
                gradeLevel: '7mo EGB',
                shift: 'MORNING',
                submittedAt: new Date('2024-05-01'),
                fatherData: { names: 'Padre ' + student.firstName, cedula: '9999999999', phone: '0988888888' },
                motherData: { names: 'Madre ' + student.firstName, cedula: '8888888888', phone: '0977777777' },
                representativeData: { names: 'Representante ' + student.firstName, relationship: 'PADRE', cedula: '9999999999' },
            }
        });

        // 5. Add dummy photo document
        await prisma.applicationDocument.create({
            data: {
                applicationId: oldApp.id,
                documentType: 'STUDENT_PHOTO',
                fileUrl: `uploads/demo_photo_${student.cedula}.jpg`,
                status: 'APPROVED'
            }
        });

        await prisma.applicationDocument.create({
            data: {
                applicationId: oldApp.id,
                documentType: 'STUDENT_ID',
                fileUrl: `uploads/demo_id_${student.cedula}.pdf`,
                status: 'APPROVED'
            }
        });
    }

    console.log('Seed: Demo students loaded successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
