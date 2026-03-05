import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Security HTTP headers
  app.use(helmet());

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

  // Documentación de la API con Swagger
  const config = new DocumentBuilder()
    .setTitle('SIAM UEFDB API')
    .setDescription('Documentación de la API del Sistema Académico SIAM')
    .setVersion('3.0.0')
    .addTag('auth', 'Endpoints de autenticación')
    .addTag('users', 'Gestión de usuarios')
    .addTag('applications', 'Proceso de admisión')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Documentación API SIAM',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = process.env.PORT || 4000;

  await app.listen(port, '0.0.0.0');
  console.log(`Backend running: http://localhost:${port}`);
  console.log(`API Docs:        http://localhost:${port}/api/docs`);
}

bootstrap();
