import { 
  IsString, 
  IsOptional, 
  IsEnum, 
  IsBoolean, 
  IsDateString,
  IsNumber,
  Min,
  Max,
  ValidateNested,
  IsObject
} from 'class-validator';
import { Type } from 'class-transformer';
import { Gender, Shift } from '@prisma/client';

// DTO para datos de lugar de nacimiento
export class BirthPlaceDto {
  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  province?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  canton?: string;

  @IsString()
  @IsOptional()
  parish?: string;
}

// DTO para datos del padre/madre
export class ParentDataDto {
  @IsString()
  @IsOptional()
  names?: string;

  @IsString()
  @IsOptional()
  cedula?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  occupation?: string;

  @IsString()
  @IsOptional()
  workPlace?: string;

  @IsString()
  @IsOptional()
  workAddress?: string;

  @IsString()
  @IsOptional()
  workPhone?: string;

  @IsBoolean()
  @IsOptional()
  livesWithStudent?: boolean;
}

// DTO para datos del representante
export class RepresentativeDataDto extends ParentDataDto {
  @IsString()
  @IsOptional()
  relationship?: string; // Parentesco

  @IsString()
  @IsOptional()
  legalGuardianDocument?: string; // Documento de tutela si no es padre/madre
}

// DTO principal para crear/actualizar solicitud
export class CreateApplicationDto {
  // Datos del Estudiante
  @IsString()
  @IsOptional()
  studentFirstName?: string;

  @IsString()
  @IsOptional()
  studentLastName?: string;

  @IsString()
  @IsOptional()
  studentCedula?: string;

  @IsDateString()
  @IsOptional()
  studentBirthDate?: string;

  @ValidateNested()
  @Type(() => BirthPlaceDto)
  @IsOptional()
  studentBirthPlace?: BirthPlaceDto;

  @IsEnum(Gender)
  @IsOptional()
  studentGender?: Gender;

  @IsString()
  @IsOptional()
  studentAddress?: string;

  @IsString()
  @IsOptional()
  studentSector?: string;

  @IsString()
  @IsOptional()
  studentPhone?: string;

  @IsString()
  @IsOptional()
  studentEmail?: string;

  @IsString()
  @IsOptional()
  studentNationality?: string;

  // Datos Médicos
  @IsString()
  @IsOptional()
  bloodType?: string;

  @IsBoolean()
  @IsOptional()
  hasDisability?: boolean;

  @IsString()
  @IsOptional()
  disabilityDetail?: string;

  @IsBoolean()
  @IsOptional()
  needsSpecialCare?: boolean;

  @IsString()
  @IsOptional()
  specialCareDetail?: string;

  // Datos Académicos
  @IsString()
  @IsOptional()
  gradeLevel?: string;

  @IsEnum(Shift)
  @IsOptional()
  shift?: Shift;

  @IsString()
  @IsOptional()
  specialty?: string; // Solo para Bachillerato

  @IsString()
  @IsOptional()
  previousSchool?: string;

  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  lastYearAverage?: number;

  @IsBoolean()
  @IsOptional()
  hasRepeatedYear?: boolean;

  @IsString()
  @IsOptional()
  repeatedYearDetail?: string;

  // Datos Familiares
  @ValidateNested()
  @Type(() => ParentDataDto)
  @IsOptional()
  fatherData?: ParentDataDto;

  @ValidateNested()
  @Type(() => ParentDataDto)
  @IsOptional()
  motherData?: ParentDataDto;

  @ValidateNested()
  @Type(() => RepresentativeDataDto)
  @IsOptional()
  representativeData?: RepresentativeDataDto;

  // Ideario UEFDB
  @IsBoolean()
  @IsOptional()
  acceptedIdeario?: boolean;
}

// DTO para actualizar (usa PartialType en el controlador)
export class UpdateApplicationDto extends CreateApplicationDto {}
