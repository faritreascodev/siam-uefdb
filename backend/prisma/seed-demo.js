const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function hash(password) {
    return await bcrypt.hash(password, 10);
}

async function main() {
    console.log('--- INICIO DE SEED MAESTRO PARA PRESENTACIÓN REALISTA ---');

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
        roles[role.name] = role.id;
    }

    // 2. USUARIOS MAESTROS (Contraseñas solicitadas por el usuario)
    const usersData = [
        { email: 'superadmin@uefdb.edu.ec', pass: 'SuperAdmin123!', first: 'Sistema', last: 'Superadmin', role: 'superadmin' },
        { email: 'admin@uefdb.edu.ec', pass: 'Admin123!', first: 'Admin', last: 'Academico', role: 'admin' },
        { email: 'rector@uefdb.edu.ec', pass: 'Rector123!', first: 'Carlos', last: 'Mendoza', role: 'rector' },
        { email: 'secretaria@uefdb.edu.ec', pass: 'Secretaria123!', first: 'Ana', last: 'Reyes', role: 'secretaria' },
        { email: 'secretaria@demo.com', pass: 'Demo123!', first: 'Secretaria', last: 'Demo', role: 'secretaria' },
        { email: 'apoderado@demo.com', pass: 'Demo123!', first: 'Carlos', last: 'Demo', role: 'apoderado' },
    ];

    const userInstances = {};
    for (const u of usersData) {
        const hashedPassword = await hash(u.pass);
        const user = await prisma.user.upsert({
            where: { email: u.email },
            update: { status: 'ACTIVO', isActive: true, password: hashedPassword },
            create: {
                email: u.email,
                password: hashedPassword,
                firstName: u.first,
                lastName: u.last,
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

    // 3. CATALOGO DE CURSOS Y CUPOS COMPLETOS
    const levels = [
        'Inicial 1', 'Inicial 2', '1ero EGB', '2do EGB', '3ro EGB',
        '4to EGB', '5to EGB', '6to EGB', '7mo EGB', '8vo EGB',
        '9no EGB', '10mo EGB', '1ero BGU', '2do BGU', '3ero BGU'
    ];

    console.log('Generando cupos para todos los cursos (Matutina y Vespertina)...');
    for (const level of levels) {
        const shifts = ['Matutina', 'Vespertina'];
        const parallels = ['A', 'B'];

        for (const shift of shifts) {
            // Lógica de Especialidades
            let specialties = [null];
            if (level.includes('BGU')) {
                specialties = ['BGU Ciencias'];
                // BT Informática SOLO en Vespertina
                if (level === '1ero BGU' && shift === 'Vespertina') {
                    specialties.push('BT Informática');
                }
            }

            for (const spec of specialties) {
                for (const p of parallels) {
                    const identifier = { level, parallel: p, shift, specialty: spec, academicYear: '2026-2027' };

                    const existingQuota = await prisma.admissionQuota.findFirst({
                        where: identifier
                    });

                    if (existingQuota) {
                        await prisma.admissionQuota.update({
                            where: { id: existingQuota.id },
                            data: { totalQuota: 30 }
                        });
                    } else {
                        await prisma.admissionQuota.create({
                            data: { ...identifier, totalQuota: 30 }
                        });
                    }
                }
            }
        }
    }

    // 4. SOLICITUDES REALISTAS (TODOS LOS ESTADOS)
    console.log('Generando solicitudes de ejemplo...');
    const scenarios = [
        { email: 'mateo@demo.ec', student: 'Mateo Villavicencio', status: 'MATRICULATED', grade: '1ero BGU', spec: 'BT Informática', shift: 'AFTERNOON', cedula: '1722839401' },
        { email: 'sofia@demo.ec', student: 'Sofía Cárdenas', status: 'APPROVED', grade: '8vo EGB', spec: null, shift: 'MORNING', cedula: '1722839402' },
        { email: 'lucas@demo.ec', student: 'Lucas Moreno', status: 'PAYMENT_UPLOADED', grade: '10mo EGB', spec: null, shift: 'AFTERNOON', cedula: '1722839403' },
        { email: 'emma@demo.ec', student: 'Emma Salazar', status: 'UNDER_REVIEW', grade: '2do EGB', spec: null, shift: 'MORNING', cedula: '1722839404' },
        { email: 'daniel@demo.ec', student: 'Daniel Rojas', status: 'CURSILLO_SCHEDULED', grade: '1ero BGU', spec: 'BGU Ciencias', shift: 'MORNING', cedula: '1722839405' },
        { email: 'valentina@demo.ec', student: 'Valentina Paz', status: 'REQUIRES_CORRECTION', grade: '9no EGB', spec: null, shift: 'AFTERNOON', cedula: '1722839406' },
        { email: 'apoderado@demo.com', student: 'David Demo', status: 'DRAFT', grade: '8vo EGB', spec: null, shift: 'MORNING', cedula: '1722839407' },
    ];

    const demoPass = await hash('Demo123!');
    for (const s of scenarios) {
        const parent = await prisma.user.upsert({
            where: { email: s.email },
            update: { status: 'ACTIVO', isActive: true },
            create: {
                email: s.email,
                password: demoPass,
                firstName: 'Representante',
                lastName: s.student.split(' ')[1],
                status: 'ACTIVO',
                isActive: true,
            }
        });
        await prisma.userRole.upsert({
            where: { userId_roleId: { userId: parent.id, roleId: roles['apoderado'] } },
            update: {},
            create: { userId: parent.id, roleId: roles['apoderado'] },
        });

        const app = await prisma.application.upsert({
            where: { studentCedula: s.cedula },
            update: { status: s.status, shift: s.shift, specialty: s.spec },
            create: {
                userId: parent.id,
                studentCedula: s.cedula,
                studentFirstName: s.student.split(' ')[0],
                studentLastName: s.student.split(' ')[1],
                status: s.status,
                gradeLevel: s.grade,
                enrollmentType: 'NEW_STUDENT',
                submittedAt: s.status !== 'DRAFT' ? new Date() : null,
                shift: s.shift,
                specialty: s.spec,
                previousSchool: 'Colegio del Norte',
                studentBirthDate: new Date('2011-05-10'),
                fatherData: { names: 'Padre de ' + s.student, phone: '099000111' },
                motherData: { names: 'Madre de ' + s.student, phone: '099000222' },
                representativeData: { names: 'Rep. ' + s.student, relationship: 'PADRE' },
                paymentReference: (s.status === 'PAYMENT_UPLOADED' || s.status === 'MATRICULATED') ? 'TRANS-9988' : null,
                paymentAmount: (s.status === 'PAYMENT_UPLOADED' || s.status === 'MATRICULATED') ? 150 : null,
                assignedParallel: s.status === 'MATRICULATED' ? 'A' : null,
                processedById: s.status === 'MATRICULATED' ? userInstances['secretaria@uefdb.edu.ec'].id : null,
            }
        });

        // Asegurar documentos si no es borrador
        if (s.status !== 'DRAFT') {
            const docTypes = ['STUDENT_PHOTO', 'STUDENT_ID', 'GRADE_CERTIFICATE'];
            for (const type of docTypes) {
                await prisma.applicationDocument.create({
                    data: {
                        applicationId: app.id,
                        documentType: type,
                        fileName: `${type.toLowerCase()}.pdf`,
                        fileUrl: `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf`,
                        fileSize: 1024 * 50,
                        mimeType: 'application/pdf'
                    }
                }).catch(() => { });
            }
        }
    }

    // 5. SESIONES DE CURSILLO (MATERIAS)
    const cursilloData = [
        { subject: 'Matemáticas Básico', code: 'MATE_8VO', level: '8vo EGB' },
        { subject: 'Lengua y Literatura', code: 'LENGUA_8VO', level: '8vo EGB' },
        { subject: 'Física Superior', code: 'FISICA_1BGU', level: '1ero BGU' },
    ];
    for (const c of cursilloData) {
        await prisma.cursilloSession.upsert({
            where: { subjectCode_gradeLevel_specialty_academicYear: { subjectCode: c.code, gradeLevel: c.level, specialty: 'BGU Ciencias', academicYear: '2026-2027' } },
            update: {},
            create: {
                subject: c.subject,
                subjectCode: c.code,
                gradeLevel: c.level,
                specialty: 'BGU Ciencias',
                academicYear: '2026-2027',
                isActive: true,
                totalSessions: 4,
                teacherName: 'Prof. Demo',
                sessionSchedule: 'Lunes a Jueves 08:00 - 10:00'
            }
        });
    }

    // 6. CONFIGURACIÓN GLOBAL
    await prisma.systemConfig.upsert({ where: { key: 'ADMISSION_OPEN' }, update: { value: 'true' }, create: { key: 'ADMISSION_OPEN', value: 'true' } });
    await prisma.systemConfig.upsert({ where: { key: 'CURRENT_ACADEMIC_YEAR' }, update: { value: '2026-2027' }, create: { key: 'CURRENT_ACADEMIC_YEAR', value: '2026-2027' } });

    console.log('--- SEED COMPLETADO: SISTEMA LISTO PARA JURADO ---');
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
