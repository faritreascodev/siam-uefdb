import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Servir archivos estáticos desde uploads
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL 
      ? process.env.FRONTEND_URL.split(',') 
      : ['http://localhost:3000', 'http://localhost:3001'],
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

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Academic System API')
    .setDescription('API documentation for Academic System - User Management & Authentication')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management endpoints (superadmin only)')
    .addTag('applications', 'Admission applications endpoints')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Academic System API Docs',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = process.env.PORT || 4000;
  console.log(`[DEBUG] Starting NestJS Server...`);
  console.log(`[DEBUG] PORT env var: ${process.env.PORT}`);
  console.log(`[DEBUG] Selected port: ${port}`);
  
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`🚀 Listening on 0.0.0.0 (IPv4)`);
}
bootstrap();
