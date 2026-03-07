import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) { }

  async getDashboardStats(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        where.createdAt.lt = end;
      }
    }

    const totalApplications = await this.prisma.application.count({ where });

    const pendingReview = await this.prisma.application.count({
      where: { ...where, status: 'SUBMITTED' },
    });

    const approved = await this.prisma.application.count({
      where: {
        ...where,
        status: { in: ['APPROVED', 'CURSILLO_APPROVED', 'PAYMENT_UPLOADED', 'PAYMENT_VALIDATED', 'MATRICULATED'] }
      },
    });

    const rejected = await this.prisma.application.count({
      where: { ...where, status: { in: ['REJECTED', 'CURSILLO_REJECTED'] } },
    });

    const matriculated = await this.prisma.application.count({
      where: { ...where, status: 'MATRICULATED' },
    });

    return {
      totalApplications,
      pendingReview,
      approved,
      rejected,
      matriculated
    };
  }

  async getDailySummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextDay = new Date(today);
    nextDay.setDate(today.getDate() + 1);

    const [newApplications, approved, rejected, pendingReview, paymentsRegistered, matriculated, cursilloEnrolled] = await Promise.all([
      // Nuevas del día (creadas hoy y que están pendientes)
      this.prisma.application.count({
        where: { createdAt: { gte: today, lt: nextDay } }
      }),
      // Aprobadas hoy
      this.prisma.application.count({
        where: {
          status: 'APPROVED',
          updatedAt: { gte: today, lt: nextDay } // asumiendo updatedAt como proxy de fecha de aprobación por simplicidad
        }
      }),
      // Rechazadas hoy
      this.prisma.application.count({
        where: {
          status: 'REJECTED',
          updatedAt: { gte: today, lt: nextDay }
        }
      }),
      // Pendientes (histórico total pendiente)
      this.prisma.application.count({ where: { status: 'UNDER_REVIEW' } }),
      // Pagos registrados hoy
      this.prisma.application.count({
        where: {
          paymentDate: { not: null },
          updatedAt: { gte: today, lt: nextDay }
        }
      }),
      // Matriculados hoy
      this.prisma.application.count({
        where: {
          status: 'MATRICULATED',
          updatedAt: { gte: today, lt: nextDay }
        }
      }),
      // Asignados a cursillo hoy
      this.prisma.application.count({
        where: {
          status: 'CURSILLO_SCHEDULED',
          updatedAt: { gte: today, lt: nextDay }
        }
      })
    ]);

    return {
      date: today.toISOString().split('T')[0],
      newApplications,
      approved,
      rejected,
      pendingReview,
      paymentsRegistered,
      matriculated,
      cursilloEnrolled
    };
  }

  async getStatsByLevel() {
    // 1. Get all quotas to know the structure (Level, Shift, Specialty, Parallel)
    const quotas = await this.prisma.admissionQuota.findMany();

    // 2. We want to aggregate statistics per "Configuration Group"
    // Usually, statistics are better viewed by Level + Shift + Specialty (ignoring parallel for a summary, or including it for detail)
    // The requirement says: "Nivel educativo, Jornada, Especialidad, Total solicitudes, Aprobadas, Rechazadas, Cupos ocupados, Cupos disponibles"

    // Let's Group Applications by level, shift, specialty
    const applications = await this.prisma.application.findMany({
      select: {
        id: true,
        gradeLevel: true, // changed from level
        shift: true,
        specialty: true,
        status: true,
      },
    });

    // 3. Process data manually to aggregate (Prisma groupBy is good but sometimes manual is more flexible for complex matching)
    const statsMap = new Map<string, {
      level: string;
      shift: string;
      specialty: string | null;
      totalApplications: number;
      approved: number;
      rejected: number;
      pending: number;
    }>();

    // Helper mappings to align Application enums/keys with Quota labels
    const mapLevel = (level: string) => {
      const mapping: Record<string, string> = {
        'inicial_1': 'Inicial 1 (3 años)',
        'inicial_2': 'Inicial 2 (4 años)',
        '1ro_basico': '1ero EGB',
        '2do_basico': '2do EGB',
        '3ro_basico': '3ero EGB',
        '4to_basico': '4to EGB',
        '5to_basico': '5to EGB',
        '6to_basico': '6to EGB',
        '7mo_basico': '7mo EGB',
        '8vo_basico': '8vo EGB',
        '9no_basico': '9no EGB',
        '10mo_basico': '10mo EGB',
        '1ro_bachillerato': '1ero BGU',
        '2do_bachillerato': '2do BGU',
        '3ro_bachillerato': '3ero BGU',
      };
      return mapping[level] || level;
    };

    const mapShift = (shift: string | null) => {
      return shift === 'MORNING' ? 'Matutina' : shift === 'AFTERNOON' ? 'Vespertina' : 'Sin jornada';
    };

    const mapSpecialty = (sp: string | null) => {
      if (!sp || sp === 'none') return 'none';
      const s = sp.toUpperCase();
      if (s.includes('CIENCIAS')) return 'BGU Ciencias';
      if (s.includes('INFORMATICA') || s.includes('INFORMÁTICA')) return 'BT Informática';
      return sp;
    };

    // Initialize map with unique keys from applications (or quotas potentially, but quotas might have 0 apps)
    // Let's iterate applications first to count reality
    applications.forEach(app => {
      const mappedLevel = mapLevel(app.gradeLevel || 'Sin nivel');
      if (!app.gradeLevel) return; // omitir registros sin nivel
      const mappedShift = mapShift(app.shift);
      const mappedSpecialty = mapSpecialty(app.specialty);
      const key = `${mappedLevel}-${mappedShift}-${mappedSpecialty}`;

      if (!statsMap.has(key)) {
        statsMap.set(key, {
          level: mappedLevel,
          shift: mappedShift,
          specialty: mappedSpecialty === 'none' ? null : mappedSpecialty,
          totalApplications: 0,
          approved: 0,
          rejected: 0,
          pending: 0,
        });
      }

      const entry = statsMap.get(key)!;
      entry.totalApplications++;

      if (['APPROVED', 'CURSILLO_APPROVED', 'PAYMENT_UPLOADED', 'PAYMENT_VALIDATED', 'MATRICULATED'].includes(app.status)) {
        entry.approved++;
      } else if (app.status === 'REJECTED' || app.status === 'CURSILLO_REJECTED') {
        entry.rejected++;
      } else {
        entry.pending++;
      }
    });

    // 4. Calculate Quotas (Occupied vs Available)
    // We need to sum up totalQuota for matching level/shift/specialty across parallels
    const quotaMap = new Map<string, number>();

    quotas.forEach(q => {
      const mappedLevel = mapLevel(q.level);
      const key = `${mappedLevel}-${q.shift}-${mapSpecialty(q.specialty)}`;
      const currentTotal = quotaMap.get(key) || 0;
      quotaMap.set(key, currentTotal + q.totalQuota);
    });

    // 5. Merge results
    const results = [];

    // We should include levels that exist in Quotas even if they have 0 applications
    const allKeys = new Set([...statsMap.keys(), ...quotaMap.keys()]);

    allKeys.forEach(key => {
      const stats = statsMap.get(key) || {
        level: '', // Will be filled below if missing
        shift: '',
        specialty: null,
        totalApplications: 0,
        approved: 0,
        rejected: 0,
        pending: 0,
      };

      // If stats was missing (0 apps), we need to extract info from key or quota
      if (!stats.level) {
        const parts = key.split('-');
        // Use matching quota to get proper casing if possible, otherwise parts
        const q = quotas.find(q => `${q.level}-${q.shift}-${q.specialty || 'none'}` === key);
        if (q) {
          stats.level = q.level;
          stats.shift = q.shift;
          stats.specialty = q.specialty;
        }
      }

      const totalQuota = quotaMap.get(key) || 0;
      // Occupied slots are basically the approved applications + specifically reserved spots if any (but here we count approved apps)
      // Note: In strict quota logic, we might count 'ASSIGNED' parallel apps, but for general stats, 'APPROVED' is the key.
      const occupied = stats.approved;
      const available = Math.max(0, totalQuota - occupied);

      results.push({
        ...stats,
        totalQuota,
        occupied,
        available
      });
    });

    return results.sort((a, b) => a.level.localeCompare(b.level));
  }
}


