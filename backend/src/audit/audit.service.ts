import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
    constructor(private prisma: PrismaService) { }

    async create(data: {
        action: string;
        entity: string;
        entityId?: string;
        details?: any;
        userId?: string;
        userEmail?: string;
        ipAddress?: string;
    }) {
        try {
            return await this.prisma.auditLog.create({
                data: {
                    action: data.action,
                    entity: data.entity,
                    entityId: data.entityId,
                    details: data.details,
                    userId: data.userId,
                    userEmail: data.userEmail,
                    ipAddress: data.ipAddress,
                },
            });
        } catch (error) {
            console.error('Failed to create audit log:', error);
            // We don't throw here to avoid breaking the main transaction/action
        }
    }

    async findAll(query: {
        action?: string;
        entity?: string;
        userId?: string;
        startDate?: string;
        endDate?: string;
        page?: number;
        limit?: number;
    }) {
        const { action, entity, userId, startDate, endDate, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (action) where.action = action;
        if (entity) where.entity = entity;
        if (userId) where.userId = userId;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        const [total, data] = await Promise.all([
            this.prisma.auditLog.count({ where }),
            this.prisma.auditLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
        ]);

        return {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            data,
        };
    }
}
