import { IsString, IsNotEmpty, IsOptional, IsEmail, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateExtraContactDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  applicationId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]+$/, { message: 'La cédula debe contener solo números' })
  cedula: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  relationship: string;
}
