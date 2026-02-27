import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ApplicationsModule,
    NotificationsModule,
    UploadsModule,
    QuotasModule,
    QuotasModule,
    InstitutionsModule,
    ReportsModule,
    ExternalApisModule,
    ExtraContactsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

