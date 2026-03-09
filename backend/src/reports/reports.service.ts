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

    const total = await this.prisma.application.count({ where });

    const draft = await this.prisma.application.count({
      where: { ...where, status: 'DRAFT' },
    });

    const submitted = await this.prisma.application.count({
      where: { ...where, status: 'SUBMITTED' },
    });

    const pendingReview = await this.prisma.application.count({
      where: { ...where, status: 'UNDER_REVIEW' },
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
      total,
      draft,
      submitted,
      underReview: pendingReview,
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
    // 1. Obtener todos los cupos configurados
    const quotas = await this.prisma.admissionQuota.findMany();

    // 2. Obtener todas las solicitudes
    const applications = await this.prisma.application.findMany({
      select: {
        id: true,
        gradeLevel: true,
        shift: true,
        specialty: true,
        status: true,
      },
    });

    // Funciones de mapeo consistentes
    const mapLevel = (level: string) => {
      const mapping: Record<string, string> = {
        'inicial_1': 'Inicial 1',
        'inicial_2': 'Inicial 2',
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
      return shift || 'Sin jornada';
    };
    const mapSpecialty = (sp: string | null) => {
      if (!sp || sp === 'none' || sp === '-') return null;
      const s = sp.toUpperCase();
      if (s.includes('CIENCIAS')) return 'BGU Ciencias';
      if (s.includes('INFORMATICA') || s.includes('INFORMÁTICA')) return 'Técnico en Informática';
      return sp;
    };

    // 3. Inicializar el mapa de estadísticas basado en los CUPOS (Cursos existentes)
    const statsMap = new Map<string, any>();

    quotas.forEach(q => {
      const mappedLevel = mapLevel(q.level);
      const mappedShift = q.shift; // Ya viene como Matutina/Vespertina en Quota
      const mappedSpecialty = mapSpecialty(q.specialty);
      const key = `${mappedLevel}|${mappedShift}|${mappedSpecialty || 'NA'}`;

      if (!statsMap.has(key)) {
        statsMap.set(key, {
          level: mappedLevel,
          shift: mappedShift,
          specialty: mappedSpecialty,
          totalApplications: 0,
          approved: 0,
          rejected: 0,
          totalQuota: 0,
        });
      }
      statsMap.get(key).totalQuota += q.totalQuota;
    });

    // 4. Procesar Aplicaciones
    applications.forEach(app => {
      const mappedLevel = mapLevel(app.gradeLevel || '');
      const mappedShift = mapShift(app.shift);
      const mappedSpecialty = mapSpecialty(app.specialty);
      const key = `${mappedLevel}|${mappedShift}|${mappedSpecialty || 'NA'}`;

      // Solo contar si el curso existe en los cupos
      if (statsMap.has(key)) {
        const entry = statsMap.get(key);
        entry.totalApplications++;

        if (['APPROVED', 'CURSILLO_APPROVED', 'PAYMENT_UPLOADED', 'PAYMENT_VALIDATED', 'MATRICULATED'].includes(app.status)) {
          entry.approved++;
        } else if (app.status === 'REJECTED' || app.status === 'CURSILLO_REJECTED') {
          entry.rejected++;
        }
      }
    });

    // 5. Convertir a array y ordenar
    return Array.from(statsMap.values()).map(s => ({
      ...s,
      occupied: s.approved,
      available: Math.max(0, s.totalQuota - s.approved)
    })).sort((a, b) => {
      const levelCompare = a.level.localeCompare(b.level, undefined, { numeric: true });
      if (levelCompare !== 0) return levelCompare;
      return a.shift.localeCompare(b.shift);
    });
  }
}


