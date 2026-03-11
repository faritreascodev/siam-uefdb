import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateCursilloSessionDto, UpdateCursilloSessionDto, UpdateEnrollmentDto } from './dto/cursillo.dto';
import { ApplicationStatus } from '@prisma/client';

// Materias por grado (las claves deben coincidir con los valores de gradeLevel en el formulario)
export const CURSILLO_SUBJECTS = {
    '8vo EGB': [
        { subject: 'Lengua y Literatura', subjectCode: 'LENGUA', specialty: null },
        { subject: 'Matemáticas', subjectCode: 'MATE', specialty: null },
        { subject: 'Inglés', subjectCode: 'INGLES', specialty: null },
    ],
    '1ero BGU': [
        { subject: 'Matemáticas', subjectCode: 'MATE_BGU', specialty: null },
        { subject: 'Física', subjectCode: 'FISICA', specialty: null },
        { subject: 'Química', subjectCode: 'QUIMICA', specialty: null },
        { subject: 'Programación', subjectCode: 'PROGRAMACION', specialty: 'TECNICO_INFORMATICA' },
    ],
    // Aliases del formato antiguo (retrocompatibilidad mientras migra)
    '8vo_basico': [
        { subject: 'Lengua y Literatura', subjectCode: 'LENGUA', specialty: null },
        { subject: 'Matemáticas', subjectCode: 'MATE', specialty: null },
        { subject: 'Inglés', subjectCode: 'INGLES', specialty: null },
    ],
    '1ro_bachillerato': [
        { subject: 'Matemáticas', subjectCode: 'MATE_BGU', specialty: null },
        { subject: 'Física', subjectCode: 'FISICA', specialty: null },
        { subject: 'Química', subjectCode: 'QUIMICA', specialty: null },
        { subject: 'Programación', subjectCode: 'PROGRAMACION', specialty: 'TECNICO_INFORMATICA' },
    ],
};

// Porcentaje mínimo de asistencia para aprobar
const MIN_ATTENDANCE_PERCENT = 80;
// Nota mínima para aprobar (sobre 10)
const MIN_SCORE = 7;

@Injectable()
export class CursilloService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService
    ) { }

    // ============ SESIONES ============

    async getAllSessions(academicYear?: string) {
        return this.prisma.cursilloSession.findMany({
            where: {
                ...(academicYear ? { academicYear } : {}),
            },
            include: {
                enrollments: {
                    include: {
                        application: {
                            select: {
                                id: true,
                                studentFirstName: true,
                                studentLastName: true,
                                studentCedula: true,
                                gradeLevel: true,
                                specialty: true,
                                status: true,
                            },
                        },
                    },
                },
            },
            orderBy: [{ gradeLevel: 'asc' }, { subjectCode: 'asc' }],
        });
    }

    async getSession(id: string) {
        const session = await this.prisma.cursilloSession.findUnique({
            where: { id },
            include: {
                enrollments: {
                    include: {
                        application: {
                            select: {
                                id: true,
                                studentFirstName: true,
                                studentLastName: true,
                                studentCedula: true,
                                gradeLevel: true,
                                specialty: true,
                                status: true,
                                previousSchool: true,
                            },
                        },
                    },
                    orderBy: { enrolledAt: 'asc' },
                },
            },
        });
        if (!session) throw new NotFoundException('Sesión de cursillo no encontrada');
        return session;
    }

    async createSession(dto: CreateCursilloSessionDto) {
        return this.prisma.cursilloSession.create({
            data: {
                subject: dto.subject,
                subjectCode: dto.subjectCode,
                gradeLevel: dto.gradeLevel,
                specialty: dto.specialty || null,
                teacherName: dto.teacherName,
                teacherEmail: dto.teacherEmail,
                teamsLink: dto.teamsLink || 'https://teams.microsoft.com/meet/24893552174366?p=sbOFw5Mv0IROZbyY0H',
                startDate: dto.startDate ? new Date(dto.startDate) : null,
                endDate: dto.endDate ? new Date(dto.endDate) : null,
                totalSessions: dto.totalSessions ?? 4,
                sessionSchedule: dto.sessionSchedule,
                academicYear: dto.academicYear || '2026-2027',
                description: dto.description,
            },
        });
    }

    async updateSession(id: string, dto: UpdateCursilloSessionDto) {
        const session = await this.prisma.cursilloSession.findUnique({ where: { id } });
        if (!session) throw new NotFoundException('Sesión no encontrada');

        return this.prisma.cursilloSession.update({
            where: { id },
            data: {
                teacherName: dto.teacherName !== undefined ? dto.teacherName : undefined,
                teacherEmail: dto.teacherEmail !== undefined ? dto.teacherEmail : undefined,
                teamsLink: dto.teamsLink !== undefined ? dto.teamsLink : undefined,
                startDate: dto.startDate !== undefined ? (dto.startDate ? new Date(dto.startDate) : null) : undefined,
                endDate: dto.endDate !== undefined ? (dto.endDate ? new Date(dto.endDate) : null) : undefined,
                totalSessions: dto.totalSessions !== undefined ? dto.totalSessions : undefined,
                sessionSchedule: dto.sessionSchedule !== undefined ? dto.sessionSchedule : undefined,
                isActive: dto.isActive !== undefined ? dto.isActive : undefined,
                description: dto.description !== undefined ? dto.description : undefined,
            },
        });
    }

    // ============ INSCRIPCIONES ============

    /**
     * Inscribir a un estudiante en TODAS las materias del cursillo que le corresponden
     * según su grado y especialidad. Crea las sesiones si no existen.
     */
    async enrollApplicationInAllSubjects(applicationId: string, academicYear: string = '2026-2027') {
        const application = await this.prisma.application.findUnique({
            where: { id: applicationId },
            select: { 
                gradeLevel: true, 
                specialty: true, 
                status: true,
                userId: true,
                studentFirstName: true,
                studentLastName: true
            },
        });

        if (!application) throw new NotFoundException('Solicitud no encontrada');

        const grade = application.gradeLevel;
        if (!grade) throw new BadRequestException('La solicitud no tiene grado asignado');

        const subjectsForGrade = CURSILLO_SUBJECTS[grade];
        if (!subjectsForGrade) {
            throw new BadRequestException(`No hay materias de cursillo configuradas para el grado: ${grade}`);
        }

        const enrollments = [];

        for (const subjectDef of subjectsForGrade) {
            // Si la materia tiene especialidad requerida, verificar que el estudiante tenga esa especialidad
            if (subjectDef.specialty && application.specialty !== subjectDef.specialty) {
                continue; // Saltar esta materia para este estudiante
            }

            // Buscar o crear la sesión
            let session = await this.prisma.cursilloSession.findFirst({
                where: {
                    subjectCode: subjectDef.subjectCode,
                    gradeLevel: grade,
                    specialty: subjectDef.specialty,
                    academicYear,
                },
            });

            if (!session) {
                // Crear sesión con valores por defecto
                session = await this.prisma.cursilloSession.create({
                    data: {
                        subject: subjectDef.subject,
                        subjectCode: subjectDef.subjectCode,
                        gradeLevel: grade,
                        specialty: subjectDef.specialty,
                        academicYear,
                        teamsLink: 'https://teams.microsoft.com/meet/24893552174366?p=sbOFw5Mv0IROZbyY0H',
                        startDate: new Date('2026-04-01'),
                        endDate: new Date('2026-05-01'),
                        totalSessions: 4,
                    },
                });
            }

            // Crear inscripción (upsert para evitar duplicados)
            const enrollment = await this.prisma.cursilloEnrollment.upsert({
                where: {
                    applicationId_sessionId: {
                        applicationId,
                        sessionId: session.id,
                    },
                },
                update: {}, // No actualizar si ya existe
                create: {
                    applicationId,
                    sessionId: session.id,
                    attendedSessions: 0,
                },
                include: {
                    session: true,
                },
            });

            enrollments.push(enrollment);
        }

        // Actualizar estado de la solicitud a CURSILLO_SCHEDULED
        await this.prisma.application.update({
            where: { id: applicationId },
            data: { 
                status: 'CURSILLO_SCHEDULED',
                cursilloScheduled: true,
            },
        });

        // Notificar al apoderado con información del cursillo
        const studentName = `${application.studentFirstName} ${application.studentLastName}`;
        const sessionsInfo = enrollments.map(e => e.session);
        
        try {
            await this.notificationsService.notifyCursilloEnrollment(
                application.userId, 
                applicationId, 
                studentName,
                sessionsInfo
            );
        } catch (error) {
            console.error('Error enviando notificación de cursillo:', error);
            // No lanzar error para no interrumpir el flujo principal
        }

        return enrollments;
    }

    /**
     * Obtener todas las inscripciones de una solicitud (uso interno admin)
     */
    async getApplicationEnrollments(applicationId: string) {
        return this.prisma.cursilloEnrollment.findMany({
            where: { applicationId },
            include: { session: true },
            orderBy: { session: { subjectCode: 'asc' } },
        });
    }

    /**
     * El apoderado consulta las inscripciones de SU propia solicitud.
     * El personal administrativo puede ver cualquier solicitud.
     */
    async getApplicationEnrollmentsForOwner(
        applicationId: string,
        requestingUserId: string,
        userRoles: string[],
    ) {
        const adminRoles = ['admin', 'superadmin', 'secretaria', 'rector'];
        const isAdmin = userRoles.some(r => adminRoles.includes(r));

        if (!isAdmin) {
            // Verificar que la solicitud pertenece al usuario
            const application = await this.prisma.application.findUnique({
                where: { id: applicationId },
                select: { userId: true, status: true },
            });

            if (!application) throw new NotFoundException('Solicitud no encontrada');

            if (application.userId !== requestingUserId) {
                throw new BadRequestException('No tienes permiso para ver esta solicitud');
            }
        }

        const enrollments = await this.prisma.cursilloEnrollment.findMany({
            where: { applicationId },
            include: { session: true },
            orderBy: { session: { subjectCode: 'asc' } },
        });

        // Retornar datos enriquecidos (porcentaje de asistencia calculado)
        return enrollments.map(e => ({
            ...e,
            attendancePercent: e.session.totalSessions > 0
                ? Math.round((e.attendedSessions / e.session.totalSessions) * 100)
                : 0,
        }));
    }

    /**
     * Actualizar una inscripción (asistencia y nota)
     */
    async updateEnrollment(enrollmentId: string, dto: UpdateEnrollmentDto) {
        const enrollment = await this.prisma.cursilloEnrollment.findUnique({
            where: { id: enrollmentId },
            include: { session: true },
        });

        if (!enrollment) throw new NotFoundException('Inscripción no encontrada');

        // Calcular si pasa (si tiene score definido)
        let passed: boolean | null = null;
        if (dto.score !== undefined && dto.score !== null) {
            const attendancePercent = (dto.attendedSessions / enrollment.session.totalSessions) * 100;
            passed = attendancePercent >= MIN_ATTENDANCE_PERCENT && dto.score >= MIN_SCORE;
        }

        return this.prisma.cursilloEnrollment.update({
            where: { id: enrollmentId },
            data: {
                attendedSessions: dto.attendedSessions,
                score: dto.score !== undefined ? dto.score : undefined,
                passed: passed,
                notes: dto.notes,
            },
            include: {
                session: true,
                application: {
                    select: { id: true, studentFirstName: true, studentLastName: true },
                },
            },
        });
    }

    /**
     * Calcular el resultado final del cursillo para una solicitud
     * y actualizar la solicitud en la BD
     */
    async computeAndSetFinalResult(applicationId: string): Promise<{ passed: boolean; reason: string; userId: string; studentName: string }> {
        const enrollments = await this.prisma.cursilloEnrollment.findMany({
            where: { applicationId },
            include: { session: true },
        });

        if (enrollments.length === 0) {
            throw new BadRequestException('El estudiante no tiene materias de cursillo registradas');
        }

        // Verificar que todas las materias estén evaluadas
        const unevaluated = enrollments.filter(e => e.score === null || e.score === undefined);
        if (unevaluated.length > 0) {
            const missing = unevaluated.map(e => e.session.subject).join(', ');
            throw new BadRequestException(`Faltan calificaciones en: ${missing}`);
        }

        // Verificar que pasa TODAS las materias
        const failedSubjects = enrollments.filter(e => e.passed === false);

        const passed = failedSubjects.length === 0;
        const status: ApplicationStatus = passed ? 'CURSILLO_APPROVED' : 'CURSILLO_REJECTED';
        const cursilloResult = passed ? 'APPROVED' : 'REJECTED';

        let reason = '';
        if (!passed) {
            reason = failedSubjects.map(e => {
                const total = e.session.totalSessions;
                const attended = e.attendedSessions;
                const pct = total > 0 ? Math.round((attended / total) * 100) : 0;
                const scoreStr = e.score !== null ? `${Number(e.score).toFixed(1)}/10 pts` : 'sin calificaci\u00f3n';
                return `${e.session.subject}: ${pct}% asistencia (${attended}/${total} sesiones), ${scoreStr}`;
            }).join('; ');
        } else {
            reason = 'Super\u00f3 todas las materias del cursillo con los m\u00ednimos requeridos';
        }

        // Actualizar la aplicación
        const updatedApp = await this.prisma.application.update({
            where: { id: applicationId },
            data: {
                status,
                cursilloResult: cursilloResult as any,
                cursilloNotes: reason,
            },
            select: {
                userId: true,
                studentFirstName: true,
                studentLastName: true,
            }
        });

        // Notificar al apoderado del resultado
        const studentName = `${updatedApp.studentFirstName} ${updatedApp.studentLastName}`;
        
        try {
            await this.notificationsService.notifyCursilloResult(
                updatedApp.userId,
                applicationId,
                studentName,
                passed,
                reason
            );
        } catch (error) {
            console.error('Error enviando notificación de resultado de cursillo:', error);
            // No lanzar error para no interrumpir el flujo principal
        }

        return { passed, reason, userId: updatedApp.userId, studentName };
    }

    /**
     * Obtener estadísticas del módulo de cursillo
     */
    async getStats(academicYear: string = '2026-2027') {
        const [requireCursillo, scheduled, approved, rejected, pending] = await Promise.all([
            this.prisma.application.count({
                where: {
                    OR: [
                        { gradeLevel: '8vo EGB' },
                        { gradeLevel: '1ero BGU' },
                        // retrocompatibilidad
                        { gradeLevel: '8vo_basico' },
                        { gradeLevel: '1ro_bachillerato' },
                    ],
                    status: { notIn: ['DRAFT', 'REJECTED', 'REQUIRES_CORRECTION'] },
                    AND: [
                        {
                            NOT: {
                                previousSchool: {
                                    contains: 'DON BOSCO',
                                    mode: 'insensitive',
                                },
                            },
                        },
                        {
                            NOT: {
                                previousSchool: {
                                    contains: 'UEFDB',
                                    mode: 'insensitive',
                                },
                            },
                        },
                    ],
                },
            }),
            this.prisma.application.count({
                where: { status: 'CURSILLO_SCHEDULED' },
            }),
            this.prisma.application.count({
                where: { status: 'CURSILLO_APPROVED' },
            }),
            this.prisma.application.count({
                where: { status: 'CURSILLO_REJECTED' },
            }),
            this.prisma.application.count({
                where: { status: 'APPROVED', cursilloScheduled: true },
            }),
        ]);

        const sessions = await this.prisma.cursilloSession.count({
            where: { academicYear, isActive: true },
        });

        const enrollments = await this.prisma.cursilloEnrollment.count();

        return {
            requireCursillo,
            scheduled,
            approved,
            rejected,
            pending,
            sessions,
            enrollments,
        };
    }

    /**
     * Notificar a todos los apoderados inscritos en una sesión cuando se actualizan sus detalles
     */
    async notifyEnrolledStudents(sessionId: string): Promise<{ notified: number; sessionSubject: string }> {
        const session = await this.prisma.cursilloSession.findUnique({
            where: { id: sessionId },
            include: {
                enrollments: {
                    include: {
                        application: {
                            select: {
                                id: true,
                                userId: true,
                                studentFirstName: true,
                                studentLastName: true,
                            },
                        },
                    },
                },
            },
        });

        if (!session) throw new NotFoundException('Sesión de cursillo no encontrada');

        let notified = 0;
        for (const enrollment of session.enrollments) {
            const app = enrollment.application;
            const studentName = `${app.studentFirstName} ${app.studentLastName}`;
            const startDateStr = session.startDate
                ? new Date(session.startDate).toLocaleDateString('es-EC', { day: '2-digit', month: 'long' })
                : 'Por confirmar';
            const endDateStr = session.endDate
                ? new Date(session.endDate).toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })
                : '';

            try {
                await this.notificationsService.create({
                    userId: app.userId,
                    type: 'APPLICATION_UNDER_REVIEW',
                    priority: 'HIGH',
                    message: `📚 Actualización del cursillo para ${studentName} — ${session.subject}:\n`
                        + `• Docente: ${session.teacherName || 'Por asignar'}\n`
                        + `• Horario: ${session.sessionSchedule || 'Por confirmar'}\n`
                        + `• Fechas: ${startDateStr}${endDateStr ? ` al ${endDateStr}` : ''}\n`
                        + `• Enlace Teams: ${session.teamsLink || 'Por confirmar'}`,
                    applicationId: app.id,
                    actionUrl: `/apoderado/solicitudes/${app.id}/cursillo`,
                });
                notified++;
            } catch (error) {
                console.error(`Error notificando a userId=${app.userId}:`, error);
            }
        }

        return { notified, sessionSubject: session.subject };
    }

    /**
     * Eliminar aplicación (liberar cupo - para estudiantes que reprueban cursillo)
     */
    async removeApplication(applicationId: string, adminUserId: string) {
        const application = await this.prisma.application.findUnique({
            where: { id: applicationId },
            select: { studentFirstName: true, studentLastName: true, status: true },
        });

        if (!application) throw new NotFoundException('Solicitud no encontrada');

        // Solo se puede eliminar si está rechazada o reprobó el cursillo
        const allowedStatuses: ApplicationStatus[] = ['CURSILLO_REJECTED', 'REJECTED'];
        if (!allowedStatuses.includes(application.status as ApplicationStatus)) {
            throw new BadRequestException(
                `Solo se puede eliminar solicitudes con estado CURSILLO_REJECTED o REJECTED. Estado actual: ${application.status}`
            );
        }

        // Borrar en cascada (documentos, extraContacts, enrollments, etc. salen por Cascade en schema)
        await this.prisma.application.delete({ where: { id: applicationId } });

        return {
            message: `Solicitud de ${application.studentFirstName} ${application.studentLastName} eliminada. Cupo liberado.`,
        };
    }
}


