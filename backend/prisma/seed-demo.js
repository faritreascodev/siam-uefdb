const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('Seed: Cargando datos de demostración...');

    const defaultPassword = await bcrypt.hash('Demo123!', 10);

    // ─────────────────────────────────────────────
    // 1. ESTUDIANTES HISTÓRICOS (para autocompletado)
    // ─────────────────────────────────────────────
    const demoCedulas = [
        { cedula: '0103957284', firstName: 'Homero', lastName: 'Velastegui', email: 'homero.velastegui@demo.com', gender: 'M', previousSchool: 'UEFDB', gradeLevel: '7mo EGB' },
        { cedula: '0208415937', firstName: 'Pedro', lastName: 'Perez', email: 'pedro.perez@demo.com', gender: 'M', previousSchool: 'Colegio Nacional', gradeLevel: '7mo EGB' },
        { cedula: '1702849365', firstName: 'Maria', lastName: 'Garcia', email: 'maria.garcia@demo.com', gender: 'F', previousSchool: 'UEFDB', gradeLevel: '10mo EGB' },
        { cedula: '1004597132', firstName: 'Juan', lastName: 'Castro', email: 'juan.castro@demo.com', gender: 'M', previousSchool: 'Colegio Técnico', gradeLevel: '7mo EGB' },
        { cedula: '0907314289', firstName: 'Ana', lastName: 'Martinez', email: 'ana.martinez@demo.com', gender: 'F', previousSchool: 'UEFDB', gradeLevel: '7mo EGB' },
    ];

    for (const student of demoCedulas) {
        try {
            let user = await prisma.user.findUnique({
                where: { cedula: student.cedula }
            });

            if (!user) {
                user = await prisma.user.create({
                    data: {
                        email: student.email,
                        password: defaultPassword,
                        firstName: student.firstName,
                        lastName: student.lastName,
                        cedula: student.cedula,
                        status: 'ACTIVO',
                        isActive: true,
                    }
                });
            }

            const role = await prisma.role.findUnique({ where: { name: 'apoderado' } });
            if (role) {
                await prisma.userRole.upsert({
                    where: { userId_roleId: { userId: user.id, roleId: role.id } },
                    update: {},
                    create: { userId: user.id, roleId: role.id }
                });
            }

            await prisma.academicRecord.create({
                data: {
                    studentCedula: student.cedula,
                    academicYear: '2024-2025',
                    gradeLevel: student.gradeLevel,
                    status: 'PASSED',
                    finalAverage: 10.0,
                }
            }).catch(() => console.log(`  AcademicRecord para ${student.cedula} ya existe.`));

            // Solicitud histórica en estado MATRICULATED (añade del año pasado)
            const existingOldApp = await prisma.application.findFirst({
                where: { userId: user.id, status: 'MATRICULATED' }
            });

            if (!existingOldApp) {
                const oldApp = await prisma.application.create({
                    data: {
                        userId: user.id,
                        studentCedula: student.cedula,
                        studentFirstName: student.firstName,
                        studentLastName: student.lastName,
                        studentGender: student.gender,
                        studentNationality: 'ECUATORIANA',
                        studentAddress: 'Av. Demo 123, Quito',
                        studentPhone: '0999000001',
                        studentEmail: student.email,
                        enrollmentType: 'RETURNING_STUDENT',
                        status: 'MATRICULATED',
                        gradeLevel: student.gradeLevel,
                        shift: 'MORNING',
                        previousSchool: student.previousSchool,
                        submittedAt: new Date('2024-05-01'),
                        fatherData: { names: 'Padre de ' + student.firstName, cedula: '9900000001', phone: '0988888801' },
                        motherData: { names: 'Madre de ' + student.firstName, cedula: '8800000001', phone: '0977777701' },
                        representativeData: { names: 'Rep. de ' + student.firstName, relationship: 'PADRE', cedula: '9900000001' },
                    }
                });

                await prisma.applicationDocument.createMany({
                    data: [
                        { applicationId: oldApp.id, documentType: 'STUDENT_PHOTO', fileUrl: `uploads/demo_photo_${student.cedula}.jpg`, status: 'APPROVED' },
                        { applicationId: oldApp.id, documentType: 'STUDENT_ID', fileUrl: `uploads/demo_id_${student.cedula}.pdf`, status: 'APPROVED' },
                    ]
                });
            }

            console.log(`  OK: Estudiante histórico ${student.cedula} cargado`);
        } catch (error) {
            console.error(`  Error en ${student.cedula}: ${error.message}`);
        }
    }

    // ─────────────────────────────────────────────
    // 2. APODERADO DE DEMOSTRACIÓN (para navegar el portal)
    // ─────────────────────────────────────────────
    try {
        const apoderadoUser = await prisma.user.upsert({
            where: { email: 'apoderado@demo.com' },
            update: {},
            create: {
                email: 'apoderado@demo.com',
                password: defaultPassword,
                firstName: 'Carlos',
                lastName: 'Demo',
                status: 'ACTIVO',
                isActive: true,
            }
        });

        const apoderadoRole = await prisma.role.findUnique({ where: { name: 'apoderado' } });
        if (apoderadoRole) {
            await prisma.userRole.upsert({
                where: { userId_roleId: { userId: apoderadoUser.id, roleId: apoderadoRole.id } },
                update: {},
                create: { userId: apoderadoUser.id, roleId: apoderadoRole.id }
            });
        }

        // Borrador de solicitud para editar y subir documentos
        const draftExists = await prisma.application.findFirst({
            where: { userId: apoderadoUser.id, status: 'DRAFT' }
        });

        if (!draftExists) {
            await prisma.application.create({
                data: {
                    userId: apoderadoUser.id,
                    status: 'DRAFT',
                    enrollmentType: 'NEW_STUDENT',
                    studentFirstName: 'Estudiante',
                    studentLastName: 'Nuevo',
                    gradeLevel: '8vo EGB',
                    shift: 'MORNING',
                }
            });
        }

        console.log('  OK: Apoderado demo cargado — apoderado@demo.com / Demo123!');
    } catch (error) {
        console.error(`  Error creando apoderado demo: ${error.message}`);
    }

    // ─────────────────────────────────────────────
    // 3. SECRETARIA DE DEMOSTRACIÓN
    // ─────────────────────────────────────────────
    try {
        const secUser = await prisma.user.upsert({
            where: { email: 'secretaria@demo.com' },
            update: {},
            create: {
                email: 'secretaria@demo.com',
                password: defaultPassword,
                firstName: 'Secretaria',
                lastName: 'Demo',
                status: 'ACTIVO',
                isActive: true,
            }
        });

        const secRole = await prisma.role.findUnique({ where: { name: 'secretaria' } });
        if (secRole) {
            await prisma.userRole.upsert({
                where: { userId_roleId: { userId: secUser.id, roleId: secRole.id } },
                update: {},
                create: { userId: secUser.id, roleId: secRole.id }
            });
        }

        console.log('  OK: Secretaria demo cargada — secretaria@demo.com / Demo123!');
    } catch (error) {
        console.error(`  Error creando secretaria demo: ${error.message}`);
    }

    // ─────────────────────────────────────────────
    // 4. ASEGURAR CONFIG: Portal abierto por defecto
    // ─────────────────────────────────────────────
    await prisma.systemConfig.upsert({
        where: { key: 'ADMISSION_OPEN' },
        update: {},
        create: { key: 'ADMISSION_OPEN', value: 'true' }
    });

    console.log('\nSeed completado. Credenciales de acceso:');
    console.log('  Apoderado: apoderado@demo.com / Demo123!');
    console.log('  Secretaria: secretaria@demo.com / Demo123!');
    console.log('  Cédulas demo: 0103957284, 0208415937, 1702849365');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
