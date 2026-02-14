import { PartialType } from '@nestjs/swagger';
import { CreateQuotaDto } from './create-quota.dto';

export class UpdateQuotaDto extends PartialType(CreateQuotaDto) {}
