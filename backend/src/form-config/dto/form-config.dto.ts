import {
    IsString,
    IsOptional,
    IsBoolean,
    IsNumber,
    IsArray,
    IsObject,
    IsNotEmpty,
    IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum FormFieldType {
    TEXT = 'text',
    SELECT = 'select',
    CHECKBOX = 'checkbox',
    TEXTAREA = 'textarea',
    NUMBER = 'number',
    DATE = 'date',
    EMAIL = 'email',
    TEL = 'tel',
}

export enum FormSection {
    STUDENT = 'student',
    FAMILY = 'family',
    ACADEMIC = 'academic',
    HEALTH = 'health',
    DOCUMENTS = 'documents',
}

export class FormFieldOption {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    value: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    label: string;
}

export class CreateFormFieldConfigDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    fieldKey: string;

    @ApiProperty({ enum: FormFieldType, default: FormFieldType.SELECT })
    @IsEnum(FormFieldType)
    @IsOptional()
    fieldType?: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    label: string;

    @ApiProperty({ enum: FormSection })
    @IsEnum(FormSection)
    @IsNotEmpty()
    section: string;

    @ApiProperty({ type: [FormFieldOption], required: false })
    @IsArray()
    @IsOptional()
    options?: FormFieldOption[];

    @ApiProperty({ default: false })
    @IsBoolean()
    @IsOptional()
    isRequired?: boolean;

    @ApiProperty({ default: true })
    @IsBoolean()
    @IsOptional()
    isEnabled?: boolean;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    placeholder?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    helpText?: string;

    @ApiProperty({ required: false })
    @IsObject()
    @IsOptional()
    validationRules?: Record<string, any>;

    @ApiProperty({ default: 0 })
    @IsNumber()
    @IsOptional()
    displayOrder?: number;
}

export class UpdateFormFieldConfigDto {
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    fieldKey?: string;

    @ApiProperty({ enum: FormFieldType, required: false })
    @IsEnum(FormFieldType)
    @IsOptional()
    fieldType?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    label?: string;

    @ApiProperty({ enum: FormSection, required: false })
    @IsEnum(FormSection)
    @IsOptional()
    section?: string;

    @ApiProperty({ type: [FormFieldOption], required: false })
    @IsArray()
    @IsOptional()
    options?: FormFieldOption[];

    @ApiProperty({ required: false })
    @IsBoolean()
    @IsOptional()
    isRequired?: boolean;

    @ApiProperty({ required: false })
    @IsBoolean()
    @IsOptional()
    isEnabled?: boolean;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    placeholder?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    helpText?: string;

    @ApiProperty({ required: false })
    @IsObject()
    @IsOptional()
    validationRules?: Record<string, any>;

    @ApiProperty({ required: false })
    @IsNumber()
    @IsOptional()
    displayOrder?: number;
}

export class UpdateFieldOptionsDto {
    @ApiProperty({ type: [FormFieldOption] })
    @IsArray()
    @IsNotEmpty()
    options: FormFieldOption[];
}


