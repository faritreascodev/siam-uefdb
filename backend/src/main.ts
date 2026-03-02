import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Static file serving (uploaded documents / payment receipts)
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // CORS — allow frontend origins
  app.enableCors({
    origin: process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',')
      : ['http://localhost:3000'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // ─────────────────────────────────────────────────────────────
  // Swagger — versionado v3 (2026-2027)
  // Accessible at: /api/docs
  // ─────────────────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('SIAM UEFDB — API')
    .setDescription(
      `## Sistema Integrado de Admisiones y Matrículas · UEFDB

### Roles y permisos

| Rol         | Descripción |
|-------------|-------------|
| superadmin  | Acceso total al sistema, sin restricciones |
| admin       | Gestión académica completa (admisiones, usuarios, configuración) |
| principal   | Rector — revisión y aprobación; sin acceso a usuarios ni configuración de sistema |
| secretary   | Secretaría — procesamiento diario con módulos configurables |
| apoderado   | Representante legal — solo sus propias solicitudes |

### Endpoints principales

- \`/auth\` — Autenticación y registro
- \`/users\` — Gestión de usuarios y roles
- \`/applications\` — Proceso de admisión
- \`/cursillos\` — Gestión de cursillo de nivelación
- \`/system-config\` — Configuración global
- \`/audit\` — Auditoría del sistema
      `,
    )
    .setVersion('3.0.0')
    .setContact('UEFDB Dev Team', 'https://uefdb.edu.ec', 'siam@uefdb.edu.ec')
    .setLicense('Proprietary', '')
    .addServer('http://localhost:4000', 'Desarrollo local')
    .addServer('https://api.uefdb.edu.ec', 'Producción')
    .addTag('auth', 'Autenticación — registro, login, recuperación de contraseña')
    .addTag('users', 'Gestión de usuarios y roles')
    .addTag('applications', 'Solicitudes de admisión — ciclo completo')
    .addTag('cursillos', 'Cursillo de nivelación — sesiones e inscripciones')
    .addTag('system-config', 'Configuración global del sistema')
    .addTag('audit', 'Auditoría de acciones del sistema')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT obtenido en /auth/login',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'SIAM UEFDB — API Docs',
    customfavIcon: '/favicon.ico',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { font-size: 1.5rem; font-weight: 700; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showCommonExtensions: true,
    },
  });

  const port = process.env.PORT || 4000;

  await app.listen(port, '0.0.0.0');
  console.log(`Backend running: http://localhost:${port}`);
  console.log(`API Docs:        http://localhost:${port}/api/docs`);
}

bootstrap();
