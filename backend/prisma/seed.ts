import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Crear roles por defecto
  const rolesToCreate = [
    { name: 'apoderado', description: 'Legal Guardian (Apoderado)' },
    { name: 'secretary', description: 'Administrative Staff (Secretaria)' },
    { name: 'principal', description: 'School Principal (Directivo)' },
    { name: 'admin', description: 'System Administrator (Superadmin)' },
    { name: 'user', description: 'Regular User' },
  ];

  const createdRoles: Record<string, string> = {};

  for (const roleData of rolesToCreate) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: {},
      create: roleData,
    });
    createdRoles[role.name] = role.id;
  }

  console.log('✅ Roles created');

  // 2. Crear Super Admin
  const adminEmail = 'admin@academyc.com';
  const hashedPassword = await bcrypt.hash('Admin123!', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      status: 'ACTIVO',
      isActive: true,
      password: hashedPassword, // Ensure password is also synced if changed in seed
    },
    create: {
      email: adminEmail,
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      status: 'ACTIVO',
      isActive: true,
    },
  });

  // Asignar rol de admin al superadmin
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: createdRoles['admin'],
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: createdRoles['admin'],
    },
  });

  console.log(`✅ Admin user created: ${adminEmail}`);

  // 3. Crear Usuario Regular (Apoderado Demo)
  const userEmail = 'apoderado@academyc.com';
  const hashedUserPassword = await bcrypt.hash('Guardian123!', 10);

  const regularUser = await prisma.user.upsert({
    where: { email: userEmail },
    update: {},
    create: {
      email: userEmail,
      password: hashedUserPassword,
      firstName: 'Guardian',
      lastName: 'Demo',
      status: 'ACTIVO',
      isActive: true,
      cedula: '0999999999', // Demo flag
    },
  });

  // Asignar rol de apoderado
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: regularUser.id,
        roleId: createdRoles['apoderado'],
      },
    },
    update: {},
    create: {
      userId: regularUser.id,
      roleId: createdRoles['apoderado'],
    },
  });

  console.log(`✅ Regular user created: ${userEmail}`);

  // 3b. Crear Secretaria
  const secretaryEmail = 'secretaria@academyc.com';
  const hashedSecretaryPassword = await bcrypt.hash('Secretaria123!', 10);

  const secretaryUser = await prisma.user.upsert({
    where: { email: secretaryEmail },
    update: {},
    create: {
      email: secretaryEmail,
      password: hashedSecretaryPassword,
      firstName: 'Ana',
      lastName: 'Secretaria',
      status: 'ACTIVO',
      isActive: true,
      cedula: '0888888888',
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: secretaryUser.id,
        roleId: createdRoles['secretary'],
      },
    },
    update: {},
    create: {
      userId: secretaryUser.id,
      roleId: createdRoles['secretary'],
    },
  });

  console.log(`✅ Secretary user created: ${secretaryEmail}`);

  // 3c. Crear Directivo (Principal)
  const principalEmail = 'rector@academyc.com';
  const hashedPrincipalPassword = await bcrypt.hash('Rector123!', 10);

  const principalUser = await prisma.user.upsert({
    where: { email: principalEmail },
    update: {},
    create: {
      email: principalEmail,
      password: hashedPrincipalPassword,
      firstName: 'Carlos',
      lastName: 'Rector',
      status: 'ACTIVO',
      isActive: true,
      cedula: '0777777777',
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: principalUser.id,
        roleId: createdRoles['principal'],
      },
    },
    update: {},
    create: {
      userId: principalUser.id,
      roleId: createdRoles['principal'],
    },
  });

  console.log(`✅ Principal user created: ${principalEmail}`);

  // 4. Crear Cupos Iniciales (2026-2027)
  console.log('📦 Seeding Admission Quotas...');

  const quotasSeed = [
    // Inicial - Matutina/Vespertina (SÓLO 20 cupos, único paralelo)
    { level: "Inicial 1 (3 años)", parallel: "Único", shift: "Matutina", specialty: null, totalQuota: 20 },
    { level: "Inicial 2 (4 años)", parallel: "Único", shift: "Matutina", specialty: null, totalQuota: 20 },
    { level: "Inicial 1 (3 años)", parallel: "Único", shift: "Vespertina", specialty: null, totalQuota: 20 },
    { level: "Inicial 2 (4 años)", parallel: "Único", shift: "Vespertina", specialty: null, totalQuota: 20 },

    // EGB - Vespertina (Paralelos A, B, C ; 25-35 máximo, 30 por defecto)
    { level: "1ero EGB", parallel: "A", shift: "Vespertina", specialty: null, totalQuota: 30 },
    { level: "1ero EGB", parallel: "B", shift: "Vespertina", specialty: null, totalQuota: 30 },
    { level: "1ero EGB", parallel: "C", shift: "Vespertina", specialty: null, totalQuota: 30 },

    { level: "2do EGB", parallel: "A", shift: "Vespertina", specialty: null, totalQuota: 30 },
    { level: "2do EGB", parallel: "B", shift: "Vespertina", specialty: null, totalQuota: 30 },
    { level: "2do EGB", parallel: "C", shift: "Vespertina", specialty: null, totalQuota: 30 },

    { level: "3ero EGB", parallel: "A", shift: "Vespertina", specialty: null, totalQuota: 30 },
    { level: "3ero EGB", parallel: "B", shift: "Vespertina", specialty: null, totalQuota: 30 },
    { level: "3ero EGB", parallel: "C", shift: "Vespertina", specialty: null, totalQuota: 30 },

    { level: "4to EGB", parallel: "A", shift: "Vespertina", specialty: null, totalQuota: 30 },
    { level: "4to EGB", parallel: "B", shift: "Vespertina", specialty: null, totalQuota: 30 },
    { level: "4to EGB", parallel: "C", shift: "Vespertina", specialty: null, totalQuota: 30 },

    { level: "5to EGB", parallel: "A", shift: "Vespertina", specialty: null, totalQuota: 30 },
    { level: "5to EGB", parallel: "B", shift: "Vespertina", specialty: null, totalQuota: 30 },
    { level: "5to EGB", parallel: "C", shift: "Vespertina", specialty: null, totalQuota: 30 },

    { level: "6to EGB", parallel: "A", shift: "Vespertina", specialty: null, totalQuota: 30 },
    { level: "6to EGB", parallel: "B", shift: "Vespertina", specialty: null, totalQuota: 30 },
    { level: "6to EGB", parallel: "C", shift: "Vespertina", specialty: null, totalQuota: 30 },

    { level: "7mo EGB", parallel: "A", shift: "Vespertina", specialty: null, totalQuota: 30 },
    { level: "7mo EGB", parallel: "B", shift: "Vespertina", specialty: null, totalQuota: 30 },
    { level: "7mo EGB", parallel: "C", shift: "Vespertina", specialty: null, totalQuota: 30 },

    // 8vo EGB - Matutina
    { level: "8vo EGB", parallel: "A", shift: "Matutina", specialty: null, totalQuota: 30 },
    { level: "8vo EGB", parallel: "B", shift: "Matutina", specialty: null, totalQuota: 30 },
    { level: "8vo EGB", parallel: "C", shift: "Matutina", specialty: null, totalQuota: 30 },

    // 8vo-10mo EGB - Vespertina
    { level: "8vo EGB", parallel: "A", shift: "Vespertina", specialty: null, totalQuota: 30 },
    { level: "8vo EGB", parallel: "B", shift: "Vespertina", specialty: null, totalQuota: 30 },
    { level: "8vo EGB", parallel: "C", shift: "Vespertina", specialty: null, totalQuota: 30 },

    { level: "9no EGB", parallel: "A", shift: "Vespertina", specialty: null, totalQuota: 30 },
    { level: "9no EGB", parallel: "B", shift: "Vespertina", specialty: null, totalQuota: 30 },
    { level: "9no EGB", parallel: "C", shift: "Vespertina", specialty: null, totalQuota: 30 },

    { level: "10mo EGB", parallel: "A", shift: "Vespertina", specialty: null, totalQuota: 30 },
    { level: "10mo EGB", parallel: "B", shift: "Vespertina", specialty: null, totalQuota: 30 },
    { level: "10mo EGB", parallel: "C", shift: "Vespertina", specialty: null, totalQuota: 30 },

    // BGU - Vespertina - Ciencias (A, B, C)
    { level: "1ero BGU", parallel: "A", shift: "Vespertina", specialty: "Ciencias", totalQuota: 30 },
    { level: "1ero BGU", parallel: "B", shift: "Vespertina", specialty: "Ciencias", totalQuota: 30 },
    { level: "1ero BGU", parallel: "C", shift: "Vespertina", specialty: "Ciencias", totalQuota: 30 },

    { level: "2do BGU", parallel: "A", shift: "Vespertina", specialty: "Ciencias", totalQuota: 30 },
    { level: "2do BGU", parallel: "B", shift: "Vespertina", specialty: "Ciencias", totalQuota: 30 },
    { level: "2do BGU", parallel: "C", shift: "Vespertina", specialty: "Ciencias", totalQuota: 30 },

    { level: "3ero BGU", parallel: "A", shift: "Vespertina", specialty: "Ciencias", totalQuota: 30 },
    { level: "3ero BGU", parallel: "B", shift: "Vespertina", specialty: "Ciencias", totalQuota: 30 },
    { level: "3ero BGU", parallel: "C", shift: "Vespertina", specialty: "Ciencias", totalQuota: 30 },

    // BGU - Vespertina - Técnico Informática (Solo A, B)
    { level: "1ero BGU", parallel: "A", shift: "Vespertina", specialty: "Técnico Informática", totalQuota: 30 },
    { level: "1ero BGU", parallel: "B", shift: "Vespertina", specialty: "Técnico Informática", totalQuota: 30 },

    { level: "2do BGU", parallel: "A", shift: "Vespertina", specialty: "Técnico Informática", totalQuota: 30 },
    { level: "2do BGU", parallel: "B", shift: "Vespertina", specialty: "Técnico Informática", totalQuota: 30 },

    { level: "3ero BGU", parallel: "A", shift: "Vespertina", specialty: "Técnico Informática", totalQuota: 30 },
    { level: "3ero BGU", parallel: "B", shift: "Vespertina", specialty: "Técnico Informática", totalQuota: 30 },
  ];

  for (const quota of quotasSeed) {
    const existing = await (prisma as any).admissionQuota.findFirst({
      where: {
        level: quota.level,
        parallel: quota.parallel,
        shift: quota.shift,
        specialty: quota.specialty,
        academicYear: "2026-2027",
      }
    });

    if (existing) {
      await (prisma as any).admissionQuota.update({
        where: { id: existing.id },
        data: { totalQuota: quota.totalQuota }
      });
    } else {
      await (prisma as any).admissionQuota.create({
        data: {
          ...quota,
          academicYear: "2026-2027",
          createdBy: "SYSTEM_SEED"
        }
      });
    }
  }

  console.log(`✅ Seeded ${quotasSeed.length} quota configurations`);

  console.log('\n🎉 Seed completed successfully!\n');
  console.log('=================================');
  console.log('Default users created:');
  console.log('=================================');
  console.log('\n👤 Admin User:');
  console.log('   Email: admin@academyc.com');
  console.log('   Password: Admin123!');
  console.log('   Role: admin (Superadmin)\n');
  console.log('👤 Regular User (Apoderado):');
  console.log('   Email: apoderado@academyc.com');
  console.log('   Password: Guardian123!');
  console.log('   Role: apoderado\n');
  console.log('👤 Secretary User:');
  console.log('   Email: secretaria@academyc.com');
  console.log('   Password: Secretaria123!');
  console.log('   Role: secretary\n');
  console.log('👤 Principal User (Rector):');
  console.log('   Email: rector@academyc.com');
  console.log('   Password: Rector123!');
  console.log('   Role: principal\n');
  console.log('=================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
