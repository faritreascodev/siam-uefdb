import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { ApplicationsModule } from './applications/applications.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UploadsModule } from './uploads/uploads.module';
import { QuotasModule } from './quotas/quotas.module';
import { InstitutionsModule } from './institutions/institutions.module';
import { ReportsModule } from './reports/reports.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ExternalApisModule } from './external-apis/external-apis.module';
import { ExtraContactsModule } from './extra-contacts/extra-contacts.module';
import { AuditModule } from './audit/audit.module';
import { SystemConfigModule } from './system-config/system-config.module';
import { CursilloModule } from './cursillo/cursillo.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    ApplicationsModule,
    NotificationsModule,
    UploadsModule,
    QuotasModule,
    InstitutionsModule,
    ReportsModule,
    ExternalApisModule,
    ExtraContactsModule,
    AuditModule,
    SystemConfigModule,
    CursilloModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
