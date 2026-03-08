const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function hash(password) {
    return await bcrypt.hash(password, 10);
}

async function main() {
    console.log('--- INICIO DE SEED MAESTRO (PRESENTACIÓN JURADO) ---');

    // 1. ROLES
    const rolesData = [
        { name: 'superadmin', description: 'Acceso total al sistema' },
        { name: 'admin', description: 'Administrador académico' },
        { name: 'rector', description: 'Rectoría / Aprobaciones' },
        { name: 'secretaria', description: 'Secretaría / Matriculación' },
        { name: 'apoderado', description: 'Padre de familia / Representante' },
    ];

    const roles = {};
    for (const r of rolesData) {
        const role = await prisma.role.upsert({
            where: { name: r.name },
            update: { description: r.description },
            create: r,
        });
        roles[r.name] = role.id;
    }

    // 2. USUARIOS ADMINISTRATIVOS
    const adminPass = await hash('Admin123!');
    const usersData = [
        { email: 'superadmin@uefdb.edu.ec', firstName: 'Admin', lastName: 'Sistema', role: 'superadmin' },
        { email: 'rector@uefdb.edu.ec', firstName: 'Carlos', lastName: 'Mendoza', role: 'rector' },
        { email: 'secretaria@uefdb.edu.ec', firstName: 'Ana', lastName: 'Reyes', role: 'secretaria' },
        { email: 'secretaria@demo.com', firstName: 'Secretaria', lastName: 'Demo', role: 'secretaria' },
    ];

    const userInstances = {};
    for (const u of usersData) {
        const user = await prisma.user.upsert({
            where: { email: u.email },
            update: { status: 'ACTIVO', isActive: true },
            create: {
                email: u.email,
                password: adminPass,
                firstName: u.firstName,
                lastName: u.lastName,
                status: 'ACTIVO',
                isActive: true,
            },
        });
        userInstances[u.email] = user;
        await prisma.userRole.upsert({
            where: { userId_roleId: { userId: user.id, roleId: roles[u.role] } },
            update: {},
            create: { userId: user.id, roleId: roles[u.role] },
        });
    }

    // 3. DATOS ACADÉMICOS (RECORDS PARA REINGRESO)
    const academicYears = ['2023-2024', '2024-2025'];
    const levels = [
        'Inicial 1', 'Inicial 2', '1ero EGB', '2do EGB', '3ro EGB',
        '4to EGB', '5to EGB', '6to EGB', '7mo EGB', '8vo EGB',
        '9no EGB', '10mo EGB', '1ero BGU', '2do BGU', '3ero BGU'
    ];

    // 4. ESCENARIOS REALISTAS
    console.log('Generando escenarios de admisiones...');
    const demoApoderadoPass = await hash('Demo123!');

    // Lista de estudiantes para poblar el sistema
    const scenarios = [
        { email: 'padre1@demo.com', studentName: 'Mateo', studentLastName: 'Villavicencio', status: 'MATRICULATED', grade: '1ero BGU', type: 'RETURNING_STUDENT', cedula: '1722839401' },
        { email: 'padre2@demo.com', studentName: 'Sofía', studentLastName: 'Cárdenas', status: 'APPROVED', grade: '8vo EGB', type: 'NEW_STUDENT', cedula: '1722839402' },
        { email: 'padre3@demo.com', studentName: 'Lucas', studentLastName: 'Moreno', status: 'PAYMENT_UPLOADED', grade: '10mo EGB', type: 'RETURNING_STUDENT', cedula: '1722839403' },
        { email: 'padre4@demo.com', studentName: 'Emma', studentLastName: 'Salazar', status: 'UNDER_REVIEW', grade: '2do EGB', type: 'NEW_STUDENT', cedula: '1722839404' },
        { email: 'padre5@demo.com', studentName: 'Daniel', studentLastName: 'Rojas', status: 'CURSILLO_SCHEDULED', grade: '1ero BGU', type: 'NEW_STUDENT', cedula: '1722839405' },
        { email: 'padre6@demo.com', studentName: 'Valentina', studentLastName: 'Paz', status: 'REQUIRES_CORRECTION', grade: '9no EGB', type: 'NEW_STUDENT', cedula: '1722839406' },
        { email: 'apoderado@demo.com', studentName: 'Hijo', studentLastName: 'Demo', status: 'DRAFT', grade: '8vo EGB', type: 'NEW_STUDENT', cedula: '1722839407' },
    ];

    for (const s of scenarios) {
        const parent = await prisma.user.upsert({
            where: { email: s.email },
            update: { status: 'ACTIVO', isActive: true },
            create: {
                email: s.email,
                password: demoApoderadoPass,
                firstName: 'Representante',
                lastName: s.studentLastName,
                status: 'ACTIVO',
                isActive: true,
            }
        });
        await prisma.userRole.upsert({
            where: { userId_roleId: { userId: parent.id, roleId: roles['apoderado'] } },
            update: {},
            create: { userId: parent.id, roleId: roles['apoderado'] },
        });

        // Crear Registro Académico Histórico (Si es Antiguo)
        if (s.type === 'RETURNING_STUDENT') {
            await prisma.academicRecord.upsert({
                where: { studentCedula_academicYear: { studentCedula: s.cedula, academicYear: '2024-2025' } },
                update: {},
                create: {
                    studentCedula: s.cedula,
                    academicYear: '2024-2025',
                    gradeLevel: levels[levels.indexOf(s.grade) - 1] || '7mo EGB',
                    finalAverage: 9.5,
                    status: 'PASSED'
                }
            });
        }

        // Crear Solicitud
        const app = await prisma.application.upsert({
            where: { studentCedula: s.cedula },
            update: { status: s.status },
            create: {
                userId: parent.id,
                studentCedula: s.cedula,
                studentFirstName: s.studentName,
                studentLastName: s.studentLastName,
                status: s.status,
                gradeLevel: s.grade,
                enrollmentType: s.type,
                submittedAt: s.status !== 'DRAFT' ? new Date() : null,
                studentGender: 'M',
                studentBirthDate: new Date('2010-01-01'),
                studentAddress: 'Quito, Ecuador',
                shift: 'MORNING',
                previousSchool: s.type === 'RETURNING_STUDENT' ? 'UEFDB' : 'Colegio Externo',
                fatherData: { names: 'Padre ' + s.studentLastName, phone: '099999999' },
                motherData: { names: 'Madre ' + s.studentLastName, phone: '088888888' },
                representativeData: { names: 'Representante ' + s.studentLastName, relationship: 'PADRE' },
                paymentReference: s.status === 'PAYMENT_UPLOADED' || s.status === 'MATRICULATED' ? 'REF-12345' : null,
                paymentAmount: s.status === 'PAYMENT_UPLOADED' || s.status === 'MATRICULATED' ? 150 : null,
                assignedParallel: s.status === 'MATRICULATED' ? 'A' : null,
                processedById: s.status === 'MATRICULATED' ? userInstances['secretaria@uefdb.edu.ec'].id : null,
            }
        });

        // Documentos Demo
        if (s.status !== 'DRAFT') {
            await prisma.applicationDocument.createMany({
                data: [
                    { applicationId: app.id, documentType: 'STUDENT_PHOTO', fileName: 'foto.jpg', fileUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + s.studentName, fileSize: 1024, mimeType: 'image/svg+xml' },
                    { applicationId: app.id, documentType: 'STUDENT_ID', fileName: 'cedula.pdf', fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', fileSize: 1024, mimeType: 'application/pdf' },
                ],
                skipDuplicates: true
            });
        }
    }

    // 5. CUPOS (TODOS LOS NIVELES LLENOS PARA EL REPORTE)
    console.log('Generando cupos para todos los cursos...');
    for (const level of levels) {
        const parallels = ['A', 'B'];
        for (const p of parallels) {
            await prisma.admissionQuota.upsert({
                where: { quotaIdentifier: { level, parallel: p, shift: 'MORNING', specialty: 'Ciencias', academicYear: '2026-2027' } },
                update: { totalQuota: 30 },
                create: { level, parallel: p, shift: 'MORNING', specialty: 'Ciencias', totalQuota: 30, academicYear: '2026-2027' }
            });
        }
    }

    // 6. CURSILLOS (MATERIAS Y SESIONES)
    console.log('Generando sesiones de cursillo...');
    const cursilloData = [
        { subject: 'Matemáticas', code: 'MATE_8VO', level: '8vo EGB' },
        { subject: 'Lengua', code: 'LENGUA_8VO', level: '8vo EGB' },
        { subject: 'Física', code: 'FISICA_1BGU', level: '1ero BGU' },
    ];
    for (const c of cursilloData) {
        await prisma.cursilloSession.upsert({
            where: { subjectCode_gradeLevel_specialty_academicYear: { subjectCode: c.code, gradeLevel: c.level, specialty: 'Ciencias', academicYear: '2026-2027' } },
            update: {},
            create: { subject: c.subject, subjectCode: c.code, gradeLevel: c.level, specialty: 'Ciencias', academicYear: '2026-2027', isActive: true, totalSessions: 4 }
        });
    }

    // 7. CONFIGURACIÓN DEL SISTEMA
    await prisma.systemConfig.upsert({ where: { key: 'ADMISSION_OPEN' }, update: { value: 'true' }, create: { key: 'ADMISSION_OPEN', value: 'true' } });
    await prisma.systemConfig.upsert({ where: { key: 'CURRENT_ACADEMIC_YEAR' }, update: { value: '2026-2027' }, create: { key: 'CURRENT_ACADEMIC_YEAR', value: '2026-2027' } });

    console.log('--- SEED COMPLETADO CON ÉXITO ---');
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
