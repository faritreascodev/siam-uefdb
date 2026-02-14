import { Module } from '@nestjs/common';
import { ExternalApisService } from './external-apis.service';
import { ExternalApisController } from './external-apis.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [ExternalApisService],
  controllers: [ExternalApisController],
})
export class ExternalApisModule {}
