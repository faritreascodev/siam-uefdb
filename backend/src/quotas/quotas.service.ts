import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemConfigService } from '../system-config/system-config.service';
import { CreateQuotaDto } from './dto/create-quota.dto';
import { UpdateQuotaDto } from './dto/update-quota.dto';

@Injectable()
export class QuotasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: SystemConfigService
  ) { }

  async create(createQuotaDto: CreateQuotaDto) {
    try {
      return await this.prisma.admissionQuota.create({
        data: {
          ...createQuotaDto,
          academicYear: createQuotaDto.academicYear || await this.configService.get('CURRENT_ACADEMIC_YEAR') || "2026-2027",
          createdBy: "ADMIN",
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Quota configuration already exists for this Level, Parallel, Shift and Specialty.');
      }
      throw error;
    }
  }

  async findAll() {
    const quotas = await this.prisma.admissionQuota.findMany({
      orderBy: [
        { level: 'asc' },
        { parallel: 'asc' },
        { shift: 'asc' },
      ],
    });

    // Fetch approved applications to calculate occupancy
    // We count both APPROVED and CURSILLO_APPROVED as "occupying" a spot
    const applications = await this.prisma.application.findMany({
      where: {
        status: { in: ['APPROVED', 'CURSILLO_APPROVED', 'PAYMENT_UPLOADED', 'PAYMENT_VALIDATED', 'MATRICULATED'] },
      },
      select: {
        gradeLevel: true,
        shift: true,
        specialty: true,
        // @ts-ignore
        assignedParallel: true,
      }
    });

    return quotas.map(q => {
      const occupied = applications.filter(app => {
        // Match Level (Exact match expected)
        if (app.gradeLevel !== q.level) return false;

        // Match Shift (Enum to String mapping)
        const appShiftStr = app.shift;
        if (appShiftStr !== q.shift) return false;

        // Match Specialty (Handle nulls)
        if ((app.specialty || null) !== (q.specialty || null)) return false;

        // Match Parallel (Strict match)
        // If app has no assigned parallel, it doesn't count towards a specific parallel quota
        // @ts-ignore
        if (app.assignedParallel !== q.parallel) return false;

        return true;
      }).length;

      return {
        ...q,
        occupiedQuota: occupied,
        availableQuota: q.totalQuota - occupied,
        occupancyPercentage: q.totalQuota > 0 ? Math.round((occupied / q.totalQuota) * 100) : 0,
      };
    });
  }

  async findOne(id: string) {
    return this.prisma.admissionQuota.findUnique({
      where: { id },
    });
  }

  async update(id: string, updateQuotaDto: UpdateQuotaDto) {
    return this.prisma.admissionQuota.update({
      where: { id },
      data: updateQuotaDto,
    });
  }

  async remove(id: string) {
    return this.prisma.admissionQuota.delete({
      where: { id },
    });
  }

  /**
   * Seed the database with initial quota configuration for 2026-2027
   */
  async seed() {
    // Explicitly type the array to avoid union type issues
    const levels = [
      'Inicial 1', 'Inicial 2', '1ero EGB', '2do EGB', '3ro EGB',
      '4to EGB', '5to EGB', '6to EGB', '7mo EGB', '8vo EGB',
      '9no EGB', '10mo EGB', '1ero BGU', '2do BGU', '3ro BGU'
    ];

    const quotasSeed: any[] = [];

    for (const level of levels) {
      const shifts = ['Matutina', 'Vespertina'];
      const parallels = level.startsWith('Inicial') ? ['Único'] : ['A', 'B', 'C'];

      for (const shift of shifts) {
        let specialties: (string | null)[] = [null];
        if (level.includes('BGU')) {
          specialties = ['BGU Ciencias'];
          if (shift === 'Vespertina') {
            specialties.push('Técnico en Informática');
          }
        }

        for (const spec of specialties) {
          for (const p of parallels) {
            quotasSeed.push({
              level,
              parallel: p,
              shift,
              specialty: spec,
              totalQuota: 30
            });
          }
        }
      }
    }

    let createdCount = 0;

    // Limpiar configuraciones previas para evitar duplicados y nombres antiguos
    await this.prisma.admissionQuota.deleteMany({});

    for (const quota of quotasSeed) {
      const existing = await this.prisma.admissionQuota.findFirst({
        where: {
          level: quota.level,
          parallel: quota.parallel,
          shift: quota.shift,
          specialty: quota.specialty,
          academicYear: "2026-2027",
        }
      });

      if (!existing) {
        await this.prisma.admissionQuota.create({
          data: {
            ...quota,
            academicYear: "2026-2027",
            createdBy: "SYSTEM_SEED"
          }
        });
        createdCount++;
      }
    }

    return { message: `Seeding completed. Created ${createdCount} new configurations.` };
  }

  /**
   * Check availability based on DB configuration
   */
  async checkAvailability(gradeLevel: string, shift: string, specialty?: string) {
    // Determine academic year from config
    const academicYear = await this.configService.get('CURRENT_ACADEMIC_YEAR') || "2026-2027";

    // 1. Find all quotas matching criteria
    const quotas = await this.prisma.admissionQuota.findMany({
      where: {
        level: gradeLevel,
        shift: { equals: shift, mode: 'insensitive' },
        specialty: specialty || null,
        academicYear
      }
    });

    if (quotas.length === 0) {
      return { available: false, totalQuotas: 0, usedQuotas: 0, remainingQuotas: 0 };
    }

    const totalQuotas = quotas.reduce((sum, q) => sum + q.totalQuota, 0);

    // 2. Count occupied spots
    // We count APPROVED and CURSILLO_APPROVED applications for this Grade-Shift-Specialty combination
    const usedQuotas = await this.prisma.application.count({
      where: {
        status: { in: ['APPROVED', 'CURSILLO_APPROVED', 'PAYMENT_UPLOADED', 'PAYMENT_VALIDATED', 'MATRICULATED'] },
        gradeLevel: gradeLevel,
        // Since Shift is an enum (MORNING/AFTERNOON) and frontend might send 'Matutina'/'Vespertina'
        // we need to be careful. However, Prisma Query for Enums usually expects the Enum Value.
        // Let's assume the mapping logic handled in Controller or here.
        // For simplicity, if shift string is passed, we map it back to Enum if possible, 
        // OR rely on the fact that existing applications have the correct enum.
        shift: shift as any,
        specialty: specialty || null,
        // We do NOT filter by assignedParallel here, because a new applicant isn't assigned yet.
        // We check if *global* space exists in the grade.
      }
    });

    return {
      available: totalQuotas > usedQuotas,
      totalQuotas,
      usedQuotas,
      remainingQuotas: totalQuotas - usedQuotas,
    };
  }

  /**
   * Verificar si un grado requiere cursillo
   */
  requiresCursillo(gradeLevel: string, previousSchool?: string): boolean {
    const grade = gradeLevel.toUpperCase();
    // Soporta formato nuevo ('8vo EGB', '1ero BGU') y legado ('8vo_basico', '1ro_bachillerato')
    const isSpecialGrade =
      grade.includes('8VO') ||
      grade.includes('1RO BGU') ||
      grade.includes('1ERO BGU') ||
      grade === '8VO_BASICO' ||
      grade === '1RO_BACHILLERATO';

    if (!isSpecialGrade) return false;

    if (previousSchool) {
      const school = previousSchool.toUpperCase();
      // Si viene de una institución relacionada a UEFDB, no requiere cursillo
      if (school.includes('UEFDB') || school.includes('DON BOSCO') || school.includes('FISCOMISIONAL')) {
        return false;
      }
    }

    return true;
  }
}


