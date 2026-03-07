import {
    IsString,
    IsOptional,
    IsNumber,
    IsBoolean,
    Min,
    Max,
    IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCursilloSessionDto {
    @IsString()
    subject: string;

    @IsString()
    subjectCode: string;

    @IsString()
    gradeLevel: string;

    @IsOptional()
    @IsString()
    specialty?: string;

    @IsOptional()
    @IsString()
    teacherName?: string;

    @IsOptional()
    @IsString()
    teacherEmail?: string;

    @IsOptional()
    @IsString()
    teamsLink?: string;

    @IsOptional()
    @IsString()
    startDate?: string;

    @IsOptional()
    @IsString()
    endDate?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(50)
    totalSessions?: number;

    @IsOptional()
    @IsString()
    sessionSchedule?: string;

    @IsOptional()
    @IsString()
    academicYear?: string;

    @IsOptional()
    @IsString()
    description?: string;
}

export class UpdateCursilloSessionDto {
    @IsOptional()
    @IsString()
    subject?: string;

    @IsOptional()
    @IsString()
    subjectCode?: string;

    @IsOptional()
    @IsString()
    gradeLevel?: string;

    @IsOptional()
    @IsString()
    specialty?: string;

    @IsOptional()
    @IsString()
    teacherName?: string;

    @IsOptional()
    @IsString()
    teacherEmail?: string;

    @IsOptional()
    @IsString()
    teamsLink?: string;

    @IsOptional()
    @IsString()
    startDate?: string;

    @IsOptional()
    @IsString()
    endDate?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(50)
    totalSessions?: number;

    @IsOptional()
    @IsString()
    sessionSchedule?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsString()
    description?: string;
}

export class UpdateEnrollmentDto {
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    attendedSessions: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    @Max(10)
    score?: number;

    @IsOptional()
    @IsString()
    notes?: string;
}


