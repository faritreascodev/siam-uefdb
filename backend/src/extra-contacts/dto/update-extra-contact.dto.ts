import { PartialType } from '@nestjs/swagger';
import { CreateExtraContactDto } from './create-extra-contact.dto';

export class UpdateExtraContactDto extends PartialType(CreateExtraContactDto) {}
