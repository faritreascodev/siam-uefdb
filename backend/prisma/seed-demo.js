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
                // Técnico en Informática en todos los niveles BGU SOLO en Vespertina
                if (shift === 'Vespertina') {
                    specialties.push('Técnico en Informática');
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

    // 4. ELIMINAR SOLICITUDES Y DATOS TRANSACCIONALES (DEJAR SISTEMA LIMPIO)
    console.log('Limpiando solicitudes y datos transaccionales previos...');
    await prisma.admissionQuota.deleteMany({});
    await prisma.applicationDocument.deleteMany({});
    await prisma.cursilloEnrollment.deleteMany({});
    await prisma.application.deleteMany({});
    await prisma.cursilloSession.deleteMany({});
    await prisma.academicRecord.deleteMany({});

    // 5. CONFIGURACIÓN GLOBAL
    await prisma.systemConfig.upsert({
        where: { key: 'ADMISSION_OPEN' },
        update: { value: 'true' },
        create: { key: 'ADMISSION_OPEN', value: 'true' }
    });
    await prisma.systemConfig.upsert({
        where: { key: 'CURRENT_ACADEMIC_YEAR' },
        update: { value: '2026-2027' },
        create: { key: 'CURRENT_ACADEMIC_YEAR', value: '2026-2027' }
    });

    console.log('--- SEED COMPLETADO: SISTEMA LIMPIO CON USUARIOS Y CURSOS ---');
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
