import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { validateCedulaEcuatoriana } from '../common/validators/cedula.validator';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, firstName, lastName, cedula, telefono, direccion, parentesco } = registerDto;

    // 1. Validar existencia de usuario (Email o Cédula)
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { cedula },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException('Email already in use');
      }
      if (existingUser.cedula === cedula) {
        throw new ConflictException('Cedula already registered');
      }
    }

    // 2. Validar Cédula Ecuatoriana
    if (!validateCedulaEcuatoriana(cedula)) {
      throw new BadRequestException('Invalid Ecuadorian ID (Cédula)');
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Crear usuario (PENDIENTE_APROBACION, sin roles)
    const newUser = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        cedula,
        telefono,
        direccion,
        parentesco,
        status: 'PENDIENTE_APROBACION', 
        isActive: false, // Legacy field sync
      },
    });

    // 5. Asignar rol 'apoderado' por defecto (con estado inactivo)
    const apoderadoRole = await this.prisma.role.findUnique({ where: { name: 'apoderado' } });
    if (apoderadoRole) {
      await this.prisma.userRole.create(
{
        data: {
          userId: newUser.id,
          roleId: apoderadoRole.id,
        },
      });
    }

    // Retornamos mensaje de éxito y ID, sin token porque requiere aprobación.
    return {
      message: 'Registration successful. Your account is pending approval by an administrator.',
      userId: newUser.id,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Buscar usuario con roles
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verificar si el usuario está activo o pendiente
    if (user.status === 'PENDIENTE_APROBACION') {
      throw new UnauthorizedException('Usuario pendiente de aprobación. Comuníquese con la administración.');
    }
    
    if (user.status === 'BLOQUEADO' || user.status === 'RECHAZADO') {
      throw new UnauthorizedException('Account blocked or rejected.');
    }

    // Legacy check
    if (!user.isActive) {
      throw new UnauthorizedException('User is inactive');
    }

    // Extraer nombres de roles
    const roleNames = user.roles.map((ur) => ur.role.name);

    // Generar JWT
    const payload = {
      sub: user.id,
      email: user.email,
      roles: roleNames,
    };

    const access_token = await this.jwtService.signAsync(payload);

    // Remove sensitive data
    const { password: _, tempPassword: __, ...userWithoutPassword } = user;

    return {
      access_token,
      user: {
        ...userWithoutPassword,
        roles: roleNames,
      },
      mustChangePassword: user.mustChangePassword, 
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        status: true,
        cedula: true,
        telefono: true,
        direccion: true,
        parentesco: true,
        createdAt: true,
        roles: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const roleNames = user.roles.map((ur) => ur.role.name);

    return {
      ...user,
      roles: roleNames,
    };
  }

  async requestPasswordRecovery(cedula: string, email: string) {
    // 1. Validar usuario
    const user = await this.prisma.user.findFirst({
      where: {
        cedula,
        email,
      },
    });

    if (!user) {
      throw new BadRequestException('No user found with provided Cedula and Email');
    }

    // 2. Crear solicitud
    await this.prisma.passwordRecoveryRequest.create({
      data: {
        userId: user.id,
        cedula,
        email,
        status: 'PENDIENTE',
      },
    });

    return {
      message: 'Recovery request submitted. An administrator will review it shortly.',
    };
  }

  async changePasswordFirstTime(userId: string, changePasswordDto: any) { 
     const { newPassword } = changePasswordDto;
     
     const hashedPassword = await bcrypt.hash(newPassword, 10);
     
     await this.prisma.user.update({
       where: { id: userId },
       data: {
         password: hashedPassword,
         mustChangePassword: false,
       },
     });

     return { message: 'Password updated successfully' };
  }
}
