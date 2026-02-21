import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, Matches, IsArray, IsOptional } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ 
    example: 'user@academyc.com',
    description: 'User email address (must be unique)' 
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ example: '1700000000', description: 'Cédula de identidad' })
  @IsString()
  @MinLength(10)
  @IsOptional()
  cedula?: string;

  @ApiProperty({ 
    example: 'SecurePass123!',
    description: 'Password (min 8 chars, 1 uppercase, 1 lowercase, 1 number)',
    minLength: 8
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).*$/, {
    message: 'La contraseña debe contener mayúsculas, minúsculas y números'
  })
  password: string;

  @ApiPropertyOptional({ example: 'John', description: 'User first name' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe', description: 'User last name' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ 
    example: ['user'],
    description: 'Array of role names to assign',
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  roleNames?: string[];
}
