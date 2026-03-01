import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const TEAMS_LINK = 'https://teams.microsoft.com/meet/24893552174366?p=sbOFw5Mv0IROZbyY0H';

async function assignRole(userId: string, roleId: string) {
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId, roleId } },
    update: {},
    create: { userId, roleId },
  });
}

async function main() {
  console.log('Starting seed...');

  // ─────────────────────────────────────────────────────────────
  // 1. ROLES
  // Hierarchy: superadmin > admin > principal > secretary > apoderado
  // ─────────────────────────────────────────────────────────────
  const roleDefs = [
    {
      name: 'superadmin',
      description: 'Superadministrador del sistema — acceso total sin restricciones incluyendo configuración de sistema, seguridad y auditoría completa',
    },
    {
      name: 'admin',
      description: 'Administrador académico — gestiona admisiones, usuarios, configuración de módulos y reportes',
    },
    {
      name: 'principal',
      description: 'Rector / Directivo — revisa y aprueba solicitudes, consulta reportes y supervisa el cursillo; sin acceso a gestión de usuarios ni configuración del sistema',
    },
    {
      name: 'secretary',
      description: 'Secretaría — procesa solicitudes, valida pagos y gestiona cursillo; módulos accesibles configurables por el administrador',
    },
    {
      name: 'apoderado',
      description: 'Representante legal — gestiona sus propias solicitudes de admisión',
    },
    {
      name: 'user',
      description: 'Usuario base del sistema',
    },
  ];

  const roles: Record<string, string> = {};
  for (const r of roleDefs) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: r,
    });
    roles[role.name] = role.id;
  }
  console.log(`Roles: ${Object.keys(roles).join(', ')}`);

  // ─────────────────────────────────────────────────────────────
  // 2. USERS
  // ─────────────────────────────────────────────────────────────
  const hash = (plain: string) => bcrypt.hash(plain, 10);

  // superadmin — full system, creates/manages everything
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

  // admin — full academic admin, no system-level
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

  // principal — rector, read + approve, no settings/users
  const rector = await prisma.user.upsert({
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
  await assignRole(rector.id, roles['principal']);

  // secretary — day-to-day processing
  const secretary = await prisma.user.upsert({
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
  await assignRole(secretary.id, roles['secretary']);

  // apoderado demo users (3 different scenarios for testing)
  const apoderadoDefs = [
    {
      email: 'apoderado1@demo.ec',
      password: 'Guardian123!',
      firstName: 'María',
      lastName: 'González',
      cedula: '0900000001',
    },
    {
      email: 'apoderado2@demo.ec',
      password: 'Guardian123!',
      firstName: 'Jorge',
      lastName: 'Ramírez',
      cedula: '0900000002',
    },
    {
      email: 'apoderado3@demo.ec',
      password: 'Guardian123!',
      firstName: 'Lucía',
      lastName: 'Pinto',
      cedula: '0900000003',
    },
  ];

  const apoderados: Record<string, string> = {};
  for (const a of apoderadoDefs) {
    const u = await prisma.user.upsert({
      where: { email: a.email },
      update: { status: 'ACTIVO', isActive: true },
      create: {
        email: a.email,
        password: await hash(a.password),
        firstName: a.firstName,
        lastName: a.lastName,
        status: 'ACTIVO',
        isActive: true,
        cedula: a.cedula,
      },
    });
    await assignRole(u.id, roles['apoderado']);
    apoderados[a.email] = u.id;
  }

  console.log('Users seeded');

  // ─────────────────────────────────────────────────────────────
  // 3. CURSILLO SESSIONS (2026-2027)
  // ─────────────────────────────────────────────────────────────
  const cursilloSessions = [
    // 8vo Básico — 3 materias
    {
      subject: 'Lengua y Literatura',
      subjectCode: 'LENGUA',
      gradeLevel: '8vo EGB',
      specialty: null,
      teacherName: 'Yeilly Wilson',
      teacherEmail: 'miss.wilson@uefdb.edu.ec',
      description: 'Comprensión lectora, gramática y escritura creativa',
      sessionSchedule: 'Martes y Jueves 08:00–10:00',
    },
    {
      subject: 'Matemáticas',
      subjectCode: 'MATE',
      gradeLevel: '8vo EGB',
      specialty: null,
      teacherName: 'Por asignar',
      teacherEmail: null,
      description: 'Aritmética, álgebra básica y geometría',
      sessionSchedule: 'Lunes y Miércoles 08:00–10:00',
    },
    {
      subject: 'Inglés',
      subjectCode: 'INGLES',
      gradeLevel: '8vo EGB',
      specialty: null,
      teacherName: 'Por asignar',
      teacherEmail: null,
      description: 'Comprensión oral y escrita, gramática básica A2',
      sessionSchedule: 'Lunes y Jueves 10:00–12:00',
    },
    // 1ro Bachillerato — materias comunes
    {
      subject: 'Matemáticas',
      subjectCode: 'MATE_BGU',
      gradeLevel: '1ero BGU',
      specialty: null,
      teacherName: 'Por asignar',
      teacherEmail: null,
      description: 'Álgebra avanzada, funciones y trigonometría',
      sessionSchedule: 'Lunes y Miércoles 14:00–16:00',
    },
    {
      subject: 'Física',
      subjectCode: 'FISICA',
      gradeLevel: '1ero BGU',
      specialty: null,
      teacherName: 'Por asignar',
      teacherEmail: null,
      description: 'Mecánica clásica, cinemática y dinámica',
      sessionSchedule: 'Martes y Jueves 14:00–16:00',
    },
    {
      subject: 'Química',
      subjectCode: 'QUIMICA',
      gradeLevel: '1ero BGU',
      specialty: null,
      teacherName: 'Por asignar',
      teacherEmail: null,
      description: 'Química general: átomo, tabla periódica y reacciones',
      sessionSchedule: 'Miércoles y Viernes 10:00–12:00',
    },
    // 1ro BGU — solo Bachillerato Técnico en Informática
    {
      subject: 'Programación',
      subjectCode: 'PROGRAMACION',
      gradeLevel: '1ero BGU',
      specialty: 'Técnico Informática',
      teacherName: 'Por asignar',
      teacherEmail: null,
      description: 'Lógica de programación, algoritmos y pseudocódigo',
      sessionSchedule: 'Viernes 14:00–18:00',
    },
  ];

  const sessionIds: Record<string, string> = {};

  for (const sess of cursilloSessions) {
    const existing = await (prisma as any).cursilloSession.findFirst({
      where: {
        subjectCode: sess.subjectCode,
        gradeLevel: sess.gradeLevel,
        specialty: sess.specialty,
        academicYear: '2026-2027',
      },
    });

    const data = {
      subject: sess.subject,
      subjectCode: sess.subjectCode,
      gradeLevel: sess.gradeLevel,
      specialty: sess.specialty,
      academicYear: '2026-2027',
      teacherName: sess.teacherName,
      teacherEmail: sess.teacherEmail,
      teamsLink: TEAMS_LINK,
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-05-01'),
      totalSessions: 4,
      sessionSchedule: sess.sessionSchedule,
      description: sess.description,
      isActive: true,
    };

    let session: any;
    if (existing) {
      session = await (prisma as any).cursilloSession.update({
        where: { id: existing.id },
        data,
      });
    } else {
      session = await (prisma as any).cursilloSession.create({ data });
    }

    sessionIds[sess.subjectCode] = session.id;
  }

  console.log(`Cursillo sessions: ${cursilloSessions.length}`);

  // ─────────────────────────────────────────────────────────────
  // 4. DEMO APPLICATIONS (full flow showcase)
  // ─────────────────────────────────────────────────────────────
  const demoApplications = [
    // --- Scenario A: Draft (started but not submitted) ---
    {
      userId: apoderados['apoderado1@demo.ec'],
      status: 'DRAFT' as const,
      studentFirstName: 'Ana',
      studentLastName: 'González Pez',
      studentCedula: '0950000001',
      studentGender: 'F' as const,
      studentBirthDate: new Date('2012-05-15'),
      studentNationality: 'ECUATORIANA',
      gradeLevel: '8vo EGB',
      shift: 'MORNING' as const,
      previousSchool: 'Escuela Juan Montalvo',
      lastYearAverage: 8.5,
      acceptedIdeario: true,
    },
    // --- Scenario B: Submitted (under review) ---
    {
      userId: apoderados['apoderado1@demo.ec'],
      status: 'UNDER_REVIEW' as const,
      submittedAt: new Date('2026-02-10'),
      studentFirstName: 'Pedro',
      studentLastName: 'González Ávila',
      studentCedula: '0950000002',
      studentGender: 'M' as const,
      studentBirthDate: new Date('2011-08-20'),
      studentNationality: 'ECUATORIANA',
      gradeLevel: '9no EGB',
      shift: 'AFTERNOON' as const,
      previousSchool: 'Colegio San Gabriel',
      lastYearAverage: 9.1,
      acceptedIdeario: true,
    },
    // --- Scenario C: Cursillo required (8vo from external school) ---
    {
      userId: apoderados['apoderado2@demo.ec'],
      status: 'CURSILLO_SCHEDULED' as const,
      submittedAt: new Date('2026-02-05'),
      studentFirstName: 'Karla',
      studentLastName: 'Ramírez Torres',
      studentCedula: '0950000003',
      studentGender: 'F' as const,
      studentBirthDate: new Date('2012-03-10'),
      studentNationality: 'ECUATORIANA',
      gradeLevel: '8vo EGB',
      shift: 'MORNING' as const,
      previousSchool: 'Escuela 15 de Marzo',
      lastYearAverage: 8.0,
      acceptedIdeario: true,
      cursilloScheduled: true,
      cursilloDate: new Date('2026-04-01'),
    },
    // --- Scenario D: Approved, awaiting payment ---
    {
      userId: apoderados['apoderado2@demo.ec'],
      status: 'APPROVED' as const,
      submittedAt: new Date('2026-01-20'),
      studentFirstName: 'Luís',
      studentLastName: 'Ramírez Quiñones',
      studentCedula: '0950000004',
      studentGender: 'M' as const,
      studentBirthDate: new Date('2010-11-05'),
      studentNationality: 'ECUATORIANA',
      gradeLevel: '10mo EGB',
      shift: 'AFTERNOON' as const,
      previousSchool: 'Colegio Benito Juárez',
      lastYearAverage: 8.8,
      acceptedIdeario: true,
    },
    // --- Scenario E: Payment uploaded, pending validation ---
    {
      userId: apoderados['apoderado3@demo.ec'],
      status: 'PAYMENT_UPLOADED' as const,
      submittedAt: new Date('2026-01-15'),
      studentFirstName: 'Valentina',
      studentLastName: 'Pinto Guerrero',
      studentCedula: '0950000005',
      studentGender: 'F' as const,
      studentBirthDate: new Date('2009-07-22'),
      studentNationality: 'ECUATORIANA',
      gradeLevel: '1ero BGU',
      shift: 'AFTERNOON' as const,
      specialty: 'Ciencias',
      previousSchool: 'Colegio Nacional Esmeraldas',
      lastYearAverage: 9.3,
      acceptedIdeario: true,
      paymentDate: new Date('2026-03-01'),
      paymentReference: 'TRX-20260301-001',
      paymentAmount: 150,
    },
    // --- Scenario F: Fully matriculated ---
    {
      userId: apoderados['apoderado3@demo.ec'],
      status: 'MATRICULATED' as const,
      submittedAt: new Date('2026-01-08'),
      studentFirstName: 'Sebastián',
      studentLastName: 'Pinto Cevallos',
      studentCedula: '0950000006',
      studentGender: 'M' as const,
      studentBirthDate: new Date('2009-04-18'),
      studentNationality: 'ECUATORIANA',
      gradeLevel: '1ero BGU',
      shift: 'AFTERNOON' as const,
      specialty: 'Técnico Informática',
      previousSchool: 'Colegio Nacional Esmeraldas',
      lastYearAverage: 8.2,
      acceptedIdeario: true,
      paymentDate: new Date('2026-02-15'),
      paymentReference: 'TRX-20260215-002',
      paymentAmount: 150,
      paymentValidatedAt: new Date('2026-02-16'),
      paymentValidatedBy: secretary.id,
      assignedParallel: 'A',
      processedById: secretary.id,
      processedAt: new Date('2026-02-17'),
    },
    // --- Scenario G: Cursillo rejected (failed, spot freed) ---
    {
      userId: apoderados['apoderado1@demo.ec'],
      status: 'CURSILLO_REJECTED' as const,
      submittedAt: new Date('2026-01-25'),
      studentFirstName: 'Roberto',
      studentLastName: 'González Solís',
      studentCedula: '0950000007',
      studentGender: 'M' as const,
      studentBirthDate: new Date('2011-12-01'),
      studentNationality: 'ECUATORIANA',
      gradeLevel: '1ero BGU',
      shift: 'MORNING' as const,
      specialty: 'Ciencias',
      previousSchool: 'Liceo Cristiano',
      lastYearAverage: 6.5,
      acceptedIdeario: true,
      cursilloScheduled: true,
      cursilloDate: new Date('2026-04-01'),
      cursilloResult: 'REJECTED' as const,
      cursilloNotes: 'Matemáticas BGU: 50% asistencia (2/4 sesiones), 4/10 pts; Física: 75% asistencia (3/4 sesiones), 5/10 pts',
    },
    // --- Scenario H: Requires correction ---
    {
      userId: apoderados['apoderado2@demo.ec'],
      status: 'REQUIRES_CORRECTION' as const,
      submittedAt: new Date('2026-02-18'),
      studentFirstName: 'Isabel',
      studentLastName: 'Ramírez León',
      studentCedula: '0950000008',
      studentGender: 'F' as const,
      studentBirthDate: new Date('2012-09-14'),
      studentNationality: 'ECUATORIANA',
      gradeLevel: '8vo_basico',
      shift: 'MORNING' as const,
      previousSchool: 'Escuela Municipal No. 7',
      lastYearAverage: 7.8,
      acceptedIdeario: true,
      correctionRequest: 'Faltan documentos: copia de cédula del representante y foto del estudiante en fondo blanco.',
      assignedToId: rector.id,
    },
  ];

  const createdApps: Record<string, any> = {};

  for (const appData of demoApplications) {
    const { userId, ...data } = appData;

    // Check if this student application already exists (by cedula)
    const existing = await prisma.application.findFirst({
      where: { studentCedula: data.studentCedula },
    });

    let app: any;
    if (existing) {
      app = await prisma.application.update({
        where: { id: existing.id },
        data: { ...data, userId },
      });
    } else {
      app = await prisma.application.create({
        data: { ...data, userId },
      });
    }

    createdApps[data.studentCedula!] = app;
  }

  console.log(`Demo applications: ${demoApplications.length}`);

  // ─────────────────────────────────────────────────────────────
  // 5. CURSILLO ENROLLMENTS for Scenario C (Karla — CURSILLO_SCHEDULED)
  // ─────────────────────────────────────────────────────────────
  const karlaApp = createdApps['0950000003'];
  if (karlaApp && sessionIds['LENGUA'] && sessionIds['MATE'] && sessionIds['INGLES']) {
    const enrollmentsToCreate = [
      { sessionId: sessionIds['LENGUA'], attendedSessions: 2, score: 8.5, passed: true },
      { sessionId: sessionIds['MATE'], attendedSessions: 3, score: null, passed: null },
      { sessionId: sessionIds['INGLES'], attendedSessions: 1, score: null, passed: null },
    ];

    for (const e of enrollmentsToCreate) {
      await (prisma as any).cursilloEnrollment.upsert({
        where: {
          applicationId_sessionId: {
            applicationId: karlaApp.id,
            sessionId: e.sessionId,
          },
        },
        update: {
          attendedSessions: e.attendedSessions,
          score: e.score,
          passed: e.passed,
        },
        create: {
          applicationId: karlaApp.id,
          sessionId: e.sessionId,
          attendedSessions: e.attendedSessions,
          score: e.score,
          passed: e.passed,
        },
      });
    }

    console.log('Cursillo enrollments for Karla DONE');
  }

  // ─────────────────────────────────────────────────────────────
  // 6. ADMISSION QUOTAS (2026-2027)
  // ─────────────────────────────────────────────────────────────
  const quotas = [
    // 8vo EGB
    { level: '8vo EGB', parallel: 'A', shift: 'Matutina', specialty: null, totalQuota: 30 },
    { level: '8vo EGB', parallel: 'B', shift: 'Matutina', specialty: null, totalQuota: 30 },
    { level: '8vo EGB', parallel: 'C', shift: 'Matutina', specialty: null, totalQuota: 30 },
    { level: '8vo EGB', parallel: 'A', shift: 'Vespertina', specialty: null, totalQuota: 30 },
    { level: '8vo EGB', parallel: 'B', shift: 'Vespertina', specialty: null, totalQuota: 30 },
    // 9no EGB
    { level: '9no EGB', parallel: 'A', shift: 'Vespertina', specialty: null, totalQuota: 30 },
    { level: '9no EGB', parallel: 'B', shift: 'Vespertina', specialty: null, totalQuota: 30 },
    // 10mo EGB
    { level: '10mo EGB', parallel: 'A', shift: 'Vespertina', specialty: null, totalQuota: 30 },
    { level: '10mo EGB', parallel: 'B', shift: 'Vespertina', specialty: null, totalQuota: 30 },
    // 1ro BGU — Ciencias (morning + afternoon)
    { level: '1ero BGU', parallel: 'A', shift: 'Matutina', specialty: 'BGU Ciencias', totalQuota: 30 },
    { level: '1ero BGU', parallel: 'B', shift: 'Matutina', specialty: 'BGU Ciencias', totalQuota: 30 },
    { level: '1ero BGU', parallel: 'A', shift: 'Vespertina', specialty: 'BGU Ciencias', totalQuota: 30 },
    { level: '1ero BGU', parallel: 'B', shift: 'Vespertina', specialty: 'BGU Ciencias', totalQuota: 30 },
    // 1ro BGU — BT Informática (afternoon only)
    { level: '1ero BGU', parallel: 'A', shift: 'Vespertina', specialty: 'BT Informática', totalQuota: 35 },
    { level: '1ero BGU', parallel: 'B', shift: 'Vespertina', specialty: 'BT Informática', totalQuota: 35 },
    // 2do BGU
    { level: '2do BGU', parallel: 'A', shift: 'Vespertina', specialty: 'BGU Ciencias', totalQuota: 30 },
    { level: '2do BGU', parallel: 'B', shift: 'Vespertina', specialty: 'BGU Ciencias', totalQuota: 30 },
    { level: '2do BGU', parallel: 'A', shift: 'Vespertina', specialty: 'BT Informática', totalQuota: 35 },
    // 3ro BGU
    { level: '3ero BGU', parallel: 'A', shift: 'Vespertina', specialty: 'BGU Ciencias', totalQuota: 30 },
    { level: '3ero BGU', parallel: 'A', shift: 'Vespertina', specialty: 'BT Informática', totalQuota: 35 },
  ];

  for (const q of quotas) {
    const existing = await (prisma as any).admissionQuota.findFirst({
      where: {
        level: q.level,
        parallel: q.parallel,
        shift: q.shift,
        specialty: q.specialty,
        academicYear: '2026-2027',
      },
    });

    if (existing) {
      await (prisma as any).admissionQuota.update({
        where: { id: existing.id },
        data: { totalQuota: q.totalQuota },
      });
    } else {
      await (prisma as any).admissionQuota.create({
        data: { ...q, academicYear: '2026-2027', createdBy: 'SYSTEM_SEED' },
      });
    }
  }

  console.log(`Quotas: ${quotas.length}`);

  // ─────────────────────────────────────────────────────────────
  // 7. SYSTEM CONFIG
  // ─────────────────────────────────────────────────────────────
  const configs = [
    // General
    { key: 'CURRENT_ACADEMIC_YEAR', value: '2026-2027', description: 'Año lectivo activo' },
    { key: 'ADMISSION_OPEN', value: 'true', description: 'Portal de admisiones abierto' },
    { key: 'ADMISSION_START_DATE', value: '2026-01-01', description: 'Inicio del período de admisión' },
    { key: 'ADMISSION_END_DATE', value: '2026-03-31', description: 'Cierre del período de admisión' },
    { key: 'CURSILLO_START_DATE', value: '2026-04-01', description: 'Inicio del cursillo' },
    { key: 'CURSILLO_END_DATE', value: '2026-05-01', description: 'Fin del cursillo' },
    { key: 'CURSILLO_MIN_ATTENDANCE', value: '80', description: 'Asistencia mínima para aprobar (%)' },
    { key: 'CURSILLO_MIN_SCORE', value: '7', description: 'Nota mínima para aprobar (/ 10)' },
    { key: 'ENROLLMENT_START_DATE', value: '2026-05-05', description: 'Inicio de matrículas' },
    { key: 'ENROLLMENT_END_DATE', value: '2026-06-30', description: 'Cierre de matrículas' },
    // Institución
    { key: 'INSTITUTION_NAME', value: 'Unidad Educativa Fiscomisional Don Bosco', description: 'Nombre oficial' },
    { key: 'INSTITUTION_SHORT_NAME', value: 'UEFDB', description: 'Siglas de la institución' },
    { key: 'INSTITUTION_RUC', value: '0890003023001', description: 'RUC institucional' },
    { key: 'INSTITUTION_CITY', value: 'Esmeraldas', description: 'Ciudad' },
    { key: 'INSTITUTION_ADDRESS', value: 'Av. Libertad y Tena, Esmeraldas', description: 'Dirección' },
    { key: 'INSTITUTION_PHONE', value: '06 2726 740', description: 'Teléfono' },
    { key: 'INSTITUTION_EMAIL', value: 'info@uefdb.edu.ec', description: 'Correo institucional' },
    // Pago
    { key: 'PAYMENT_AMOUNT', value: '150.00', description: 'Valor de matrícula (USD)' },
    { key: 'PAYMENT_BANK', value: 'Banco Pichincha', description: 'Banco receptor' },
    { key: 'PAYMENT_ACCOUNT', value: '2204547267', description: 'Número de cuenta' },
    { key: 'PAYMENT_ACCOUNT_TYPE', value: 'Corriente', description: 'Tipo de cuenta' },
    { key: 'PAYMENT_ACCOUNT_HOLDER', value: 'Unidad Educativa Fiscomisional Don Bosco', description: 'Titular de la cuenta' },
    // Secretary module access
    {
      key: 'SECRETARY_MANAGE_USERS',
      value: 'false',
      description: 'Permite a secretaría gestionar usuarios',
    },
    {
      key: 'SECRETARY_MODULES',
      value: JSON.stringify({
        dashboard: true,
        admisiones: true,
        matriculacion: true,
        cupos: true,
        cursillos: true,
        reportes: true,
        usuarios: false,
        configuracion: false,
        auditoria: false,
      }),
      description: 'Módulos del panel habilitados para secretaría',
    },
  ];

  for (const c of configs) {
    await (prisma as any).systemConfig.upsert({
      where: { key: c.key },
      update: { description: c.description },
      create: c,
    });
  }

  console.log(`System configs: ${configs.length}`);

  // ─────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────
  console.log('\n=======================================================');
  console.log('SEED COMPLETED — UEFDB SIAM v3 · 2026-2027');
  console.log('=======================================================');
  console.log('Credentials:');
  console.log('  superadmin@uefdb.edu.ec  / SuperAdmin123!   (superadmin)');
  console.log('  admin@uefdb.edu.ec       / Admin123!        (admin)');
  console.log('  rector@uefdb.edu.ec      / Rector123!       (principal)');
  console.log('  secretaria@uefdb.edu.ec  / Secretaria123!   (secretary)');
  console.log('  apoderado1@demo.ec       / Guardian123!     (apoderado)');
  console.log('  apoderado2@demo.ec       / Guardian123!     (apoderado)');
  console.log('  apoderado3@demo.ec       / Guardian123!     (apoderado)');
  console.log('-------------------------------------------------------');
  console.log('Demo applications cover all states:');
  console.log('  DRAFT, UNDER_REVIEW, REQUIRES_CORRECTION,');
  console.log('  APPROVED, PAYMENT_UPLOADED, MATRICULATED,');
  console.log('  CURSILLO_SCHEDULED, CURSILLO_REJECTED');
  console.log('=======================================================\n');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
