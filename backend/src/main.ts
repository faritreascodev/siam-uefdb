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

  // CORS — allow frontend origins (any localhost port for dev + env var for prod)
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, Postman)
      if (!origin) return callback(null, true);
      // Allow any localhost port for local development
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      // Allow configured FRONTEND_URL in production
      const allowed = process.env.FRONTEND_URL
        ? process.env.FRONTEND_URL.split(',')
        : [];
      if (allowed.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS: origin not allowed — ${origin}`));
    },
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

  // Protect Swagger route with Basic Auth
  app.use(['/api/docs', '/api/docs-json'], (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.setHeader('WWW-Authenticate', 'Basic realm="API Docs"');
      return res.status(401).send('Se requiere autenticación');
    }

    const auth = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
    const user = auth[0];
    const pass = auth[1];

    if (user === 'admin' && pass === 'Uefdb2026!') {
      next();
    } else {
      res.setHeader('WWW-Authenticate', 'Basic realm="API Docs"');
      return res.status(401).send('Credenciales inválidas');
    }
  });

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


