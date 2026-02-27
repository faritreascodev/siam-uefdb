import { Module } from '@nestjs/common';
import { ExtraContactsService } from './extra-contacts.service';
import { ExtraContactsController } from './extra-contacts.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ExtraContactsController],
  providers: [ExtraContactsService],
})
export class ExtraContactsModule {}
