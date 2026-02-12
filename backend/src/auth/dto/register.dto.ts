import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsEnum, IsArray } from 'class-validator';

export enum Parentesco {
  PADRE = 'PADRE',
  MADRE = 'MADRE',
  ABUELO_ABUELA = 'ABUELO_ABUELA',
  TIO_TIA = 'TIO_TIA',
  TUTOR_LEGAL = 'TUTOR_LEGAL',
}

export class RegisterDto {
  @ApiProperty({ example: 'juan.perez@example.com', description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!', description: 'User password' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: 'Juan', description: 'First name' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Perez', description: 'Last name' })
  @IsOptional()
  @IsString()
  lastName?: string;

  // New fields for MVP Auth
  @ApiProperty({ example: '0999999999', description: 'Ecuadorian ID Card (Cédula)' })
  @IsNotEmpty()
  @IsString()
  cedula: string;

  @ApiPropertyOptional({ example: '0987654321', description: 'Mobile phone number' })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional({ example: 'Av. Siempre Viva 123', description: 'Home address' })
  @IsOptional()
  @IsString()
  direccion?: string;

  @ApiPropertyOptional({ 
    enum: Parentesco, 
    example: Parentesco.PADRE, 
    description: 'Relationship to the student' 
  })
  @IsOptional()
  @IsEnum(Parentesco)
  parentesco?: Parentesco;

  @ApiPropertyOptional({ example: ['user'] })
  @IsOptional()
  @IsArray()
  roles?: string[];
}
