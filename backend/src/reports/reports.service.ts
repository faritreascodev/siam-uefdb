import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const totalApplications = await this.prisma.application.count();

    const pendingReview = await this.prisma.application.count({
      where: { status: 'SUBMITTED' },
    });

    const approved = await this.prisma.application.count({
      where: { 
        status: { in: ['APPROVED', 'CURSILLO_APPROVED'] } 
      },
    });

    const rejected = await this.prisma.application.count({
      where: { status: 'REJECTED' },
    });

    const approvalRate = totalApplications > 0 
      ? Math.round((approved / totalApplications) * 100) 
      : 0;

    return {
      totalApplications,
      pendingReview,
      approved,
      rejected,
      approvalRate,
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

    // Initialize map with unique keys from applications (or quotas potentially, but quotas might have 0 apps)
    // Let's iterate applications first to count reality
    applications.forEach(app => {
        const key = `${app.gradeLevel}-${app.shift}-${app.specialty || 'none'}`;
        
        if (!statsMap.has(key)) {
            statsMap.set(key, {
                level: app.gradeLevel || 'Desconocido', // Handle null just in case
                shift: app.shift,
                specialty: app.specialty,
                totalApplications: 0,
                approved: 0,
                rejected: 0,
                pending: 0,
            });
        }

        const entry = statsMap.get(key)!;
        entry.totalApplications++;

        if (['APPROVED', 'CURSILLO_APPROVED'].includes(app.status)) {
            entry.approved++;
        } else if (app.status === 'REJECTED') {
            entry.rejected++;
        } else {
            entry.pending++;
        }
    });

    // 4. Calculate Quotas (Occupied vs Available)
    // We need to sum up totalQuota for matching level/shift/specialty across parallels
    const quotaMap = new Map<string, number>();

    quotas.forEach(q => {
        const key = `${q.level}-${q.shift}-${q.specialty || 'none'}`;
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
