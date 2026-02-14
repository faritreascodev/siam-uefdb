import { IsString, IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateQuotaDto {
  @ApiProperty({ example: 'Inicial 1 (3 años)' })
  @IsString()
  level: string;

  @ApiProperty({ example: 'A' })
  @IsString()
  parallel: string;

  @ApiProperty({ example: 'Matutina' })
  @IsString()
  shift: string;

  @ApiProperty({ example: 'Ciencias', required: false })
  @IsOptional()
  @IsString()
  specialty?: string;

  @ApiProperty({ example: 30 })
  @IsInt()
  @Min(1)
  totalQuota: number;

  @ApiProperty({ example: '2026-2027', required: false })
  @IsOptional()
  @IsString()
  academicYear?: string;
}
