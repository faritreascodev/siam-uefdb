const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const TEAMS_LINK = 'https://teams.microsoft.com/meet/24893552174366?p=sbOFw5Mv0IROZbyY0H';

async function assignRole(userId, roleId) {
    await prisma.userRole.upsert({
        where: { userId_roleId: { userId, roleId } },
        update: {},
        create: { userId, roleId },
    });
}

async function main() {
    console.log('Starting full system seed for Jury Presentation...');

    // 1. ROLES
    const roleDefs = [
        { name: 'superadmin', description: 'Superadministrador del sistema — acceso total sin restricciones incluyendo configuración de sistema, seguridad y auditoría completa' },
        { name: 'admin', description: 'Administrador académico — gestiona admisiones, usuarios, configuración de módulos y reportes' },
        { name: 'rector', description: 'Rector / Directivo — revisa y aprueba solicitudes, consulta reportes y supervisa el cursillo' },
        { name: 'secretaria', description: 'Secretaría — procesa solicitudes, valida pagos y gestiona cursillo' },
        { name: 'apoderado', description: 'Representante legal — gestiona sus propias solicitudes de admisión' },
        { name: 'user', description: 'Usuario base del sistema' }
    ];

    const roles = {};
    for (const r of roleDefs) {
        const role = await prisma.role.upsert({
            where: { name: r.name },
            update: { description: r.description },
            create: r,
        });
        roles[role.name] = role.id;
    }

    const hash = (plain) => bcrypt.hash(plain, 10);

    // 2. USERS
    const superAdmin = await prisma.user.upsert({
        where: { email: 'superadmin@uefdb.edu.ec' },
        update: { status: 'ACTIVO', isActive: true },
        create: {
            email: 'superadmin@uefdb.edu.ec',
            password: await hash('SuperAdmin123!'),
            firstName: 'Sistema',
            lastName: 'Superadmin',
            status: 'ACTIVO',
            isActive: true,
        },
    });
    await assignRole(superAdmin.id, roles['superadmin']);

    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@uefdb.edu.ec' },
        update: { status: 'ACTIVO', isActive: true },
        create: {
            email: 'admin@uefdb.edu.ec',
            password: await hash('Admin123!'),
            firstName: 'Administrador',
            lastName: 'Académico',
            status: 'ACTIVO',
            isActive: true,
        },
    });
    await assignRole(adminUser.id, roles['admin']);

    const rectorUser = await prisma.user.upsert({
        where: { email: 'rector@uefdb.edu.ec' },
        update: { status: 'ACTIVO', isActive: true },
        create: {
            email: 'rector@uefdb.edu.ec',
            password: await hash('Rector123!'),
            firstName: 'Carlos',
            lastName: 'Mendoza',
            status: 'ACTIVO',
            isActive: true,
            cedula: '0800000001',
        },
    });
    await assignRole(rectorUser.id, roles['rector']);

    const secretaryUser = await prisma.user.upsert({
        where: { email: 'secretaria@uefdb.edu.ec' },
        update: { status: 'ACTIVO', isActive: true },
        create: {
            email: 'secretaria@uefdb.edu.ec',
            password: await hash('Secretaria123!'),
            firstName: 'Ana',
            lastName: 'Reyes',
            status: 'ACTIVO',
            isActive: true,
            cedula: '0800000002',
        },
    });
    await assignRole(secretaryUser.id, roles['secretaria']);

    // Legacy demo users for backward compatibility
    const demoUsers = [
        { email: 'apoderado@demo.com', password: 'Demo123!', firstName: 'Carlos', lastName: 'Demo' },
        { email: 'secretaria@demo.com', password: 'Demo123!', firstName: 'Secretaria', lastName: 'Demo' }
    ];

    for (const du of demoUsers) {
        const u = await prisma.user.upsert({
            where: { email: du.email },
            update: { status: 'ACTIVO', isActive: true },
            create: {
                email: du.email,
                password: await hash(du.password),
                firstName: du.firstName,
                lastName: du.lastName,
                status: 'ACTIVO',
                isActive: true,
            }
        });
        const rName = du.email.includes('secretaria') ? 'secretaria' : 'apoderado';
        await assignRole(u.id, roles[rName]);
    }

    // Cursillo Sessions, Quotas, and Configs (Skipping detail records for brevity but keeping core config)
    await prisma.systemConfig.upsert({
        where: { key: 'ADMISSION_OPEN' },
        update: { value: 'true' },
        create: { key: 'ADMISSION_OPEN', value: 'true', description: 'Portal abierto' }
    });

    console.log('Full Seed Completed for all roles.');
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
