import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuotaDto } from './dto/create-quota.dto';
import { UpdateQuotaDto } from './dto/update-quota.dto';

@Injectable()
export class QuotasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createQuotaDto: CreateQuotaDto) {
    try {
      return await this.prisma.admissionQuota.create({
        data: {
          ...createQuotaDto,
          academicYear: createQuotaDto.academicYear || "2026-2027",
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
        status: { in: ['APPROVED', 'CURSILLO_APPROVED'] }, 
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
          
          // Match Shift (Direct comparison now that enum is in Spanish)
          if (app.shift !== q.shift) return false;
 
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
    const quotasSeed: { level: string; parallel: string; shift: string; specialty: string | null; totalQuota: number }[] = [
      // Inicial - Matutina
      { level: "Inicial 1 (3 años)", parallel: "Único", shift: "Matutina", specialty: null, totalQuota: 30 },
      { level: "Inicial 2 (4 años)", parallel: "Único", shift: "Matutina", specialty: null, totalQuota: 35 },
      
      // Inicial - Vespertina
      { level: "Inicial 1 (3 años)", parallel: "Único", shift: "Vespertina", specialty: null, totalQuota: 35 },
      { level: "Inicial 2 (4 años)", parallel: "Único", shift: "Vespertina", specialty: null, totalQuota: 35 },
      
      // EGB Elemental & Media (1ero a 7mo) - Vespertina
      ...["1ero EGB", "2do EGB", "3ro EGB", "4to EGB", "5to EGB", "6to EGB", "7mo EGB"].flatMap(level => [
        { level, parallel: "A", shift: "Vespertina", specialty: null, totalQuota: 30 },
        { level, parallel: "B", shift: "Vespertina", specialty: null, totalQuota: 30 }
      ]),

      // 8vo EGB - Matutina
      { level: "8vo EGB", parallel: "A", shift: "Matutina", specialty: null, totalQuota: 30 },
      { level: "8vo EGB", parallel: "B", shift: "Matutina", specialty: null, totalQuota: 30 },

      // 8vo, 9no, 10mo EGB - Vespertina
      ...["8vo EGB", "9no EGB", "10mo EGB"].flatMap(level => [
        { level, parallel: "A", shift: "Vespertina", specialty: null, totalQuota: 30 },
        { level, parallel: "B", shift: "Vespertina", specialty: null, totalQuota: 30 }
      ]),

      // Bachillerato - Ciencias (1ero, 2do, 3ro) - Vespertina
      ...["1ero BGU", "2do BGU", "3ro BGU"].flatMap(level => [
        { level, parallel: "A", shift: "Vespertina", specialty: "Ciencias", totalQuota: 20 },
        { level, parallel: "B", shift: "Vespertina", specialty: "Ciencias", totalQuota: 20 }
      ]),

      // Bachillerato - Técnico (1ero, 2do, 3ro) - Vespertina
      ...["1ero BGU", "2do BGU", "3ro BGU"].flatMap(level => [
        { level, parallel: "A", shift: "Vespertina", specialty: "Técnico Informática", totalQuota: 20 },
        { level, parallel: "B", shift: "Vespertina", specialty: "Técnico Informática", totalQuota: 20 }
      ]),
    ];

    let createdCount = 0;
    
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
    // Determine academic year (hardcoded for now as per req, or env)
    const academicYear = "2026-2027";

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
        status: { in: ['APPROVED', 'CURSILLO_APPROVED'] },
        gradeLevel: gradeLevel,
        shift: shift, // Direct comparison now that enum is in Spanish
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
  requiresCursillo(gradeLevel: string): boolean {
    const grade = gradeLevel.toUpperCase();
    return grade.includes('8VO') || grade.includes('1RO BGU') || grade.includes('1ERO BGU');
  }
}
