'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { getApplication } from '@/lib/api-applications';
import { getCursilloEnrollmentsForApoderado } from '@/lib/api-cursillo';
import { Application, STATUS_LABELS, GRADE_LEVELS } from '@/types/application';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow,
} from '@/components/ui/table';
import {
    ArrowLeft, Video, BookOpen, CheckCircle2,
    XCircle, Clock, ExternalLink, Info, Award,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PageProps {
    params: Promise<{ id: string }>;
}

interface Enrollment {
    id: string;
    attendedSessions: number;
    score: number | null;
    passed: boolean | null;
    notes: string | null;
    session: {
        subject: string;
        subjectCode: string;
        totalSessions: number;
        teacherName: string | null;
        teacherEmail: string | null;
        teamsLink: string | null;
        sessionSchedule: string | null;
        startDate: string | null;
        endDate: string | null;
        description: string | null;
    };
}

const RESULT_LABELS: Record<string, string> = {
    APPROVED: 'Aprobado',
    REJECTED: 'Reprobado',
    PENDING: 'Pendiente',
};

export default function ApoderadoCursilloPage({ params }: PageProps) {
    const { id } = use(params);
    const { data: session } = useSession();
    const router = useRouter();

    const [application, setApplication] = useState<Application | null>(null);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);

    const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;

    useEffect(() => {
        if (!token || !id) return;

        const load = async () => {
            try {
                const [app, enrs] = await Promise.all([
                    getApplication(token, id),
                    getCursilloEnrollmentsForApoderado(token, id),
                ]);
                setApplication(app);
                setEnrollments(enrs);
            } catch {
                router.push('/apoderado');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [token, id, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    if (!application) return null;

    const isCursilloStatus = [
        'CURSILLO_SCHEDULED',
        'CURSILLO_APPROVED',
        'CURSILLO_REJECTED',
    ].includes(application.status);

    const gradeLabel = GRADE_LEVELS.find(g => g.value === application.gradeLevel)?.label || application.gradeLevel;

    const totalSubjects = enrollments.length;
    const evaluatedSubjects = enrollments.filter(e => e.score !== null).length;
    const passedSubjects = enrollments.filter(e => e.passed === true).length;
    const overallPassed = application.cursilloResult === 'APPROVED';
    const overallRejected = application.cursilloResult === 'REJECTED';

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Back nav */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/apoderado/solicitudes/${id}`}>
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Cursillo de Admisión</h1>
                    <p className="text-sm text-muted-foreground">
                        {application.studentFirstName} {application.studentLastName} · {gradeLabel}
                    </p>
                </div>
            </div>

            {/* Main result banner */}
            {overallPassed && (
                <Alert className="border-green-300 bg-green-50">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <AlertTitle className="text-green-800">Cursillo Aprobado</AlertTitle>
                    <AlertDescription className="text-green-700">
                        El estudiante superó todas las materias del cursillo con los requisitos mínimos.
                        Secretaría coordinará los siguientes pasos del proceso de matrícula.
                    </AlertDescription>
                </Alert>
            )}

            {overallRejected && (
                <Alert className="border-red-300 bg-red-50" variant="destructive">
                    <XCircle className="h-5 w-5" />
                    <AlertTitle>Cursillo Reprobado</AlertTitle>
                    <AlertDescription>
                        El estudiante no alcanzó los requisitos mínimos. Se ha liberado el cupo.
                        {application.cursilloNotes && (
                            <p className="mt-2 font-medium">{application.cursilloNotes}</p>
                        )}
                    </AlertDescription>
                </Alert>
            )}

            {application.status === 'CURSILLO_SCHEDULED' && (
                <Alert className="border-blue-300 bg-blue-50">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <AlertTitle className="text-blue-800">Cursillo en Progreso</AlertTitle>
                    <AlertDescription className="text-blue-700">
                        El cursillo está activo. Conéctese puntualmente a cada sesión.
                        La nota final se publicará una vez que secretaría registre todas las evaluaciones.
                    </AlertDescription>
                </Alert>
            )}

            {/* What is the cursillo — info card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5 text-blue-500" />
                        ¿Qué es el Cursillo de Admisión?
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                    <p>
                        El cursillo de admisión es un proceso de nivelación obligatorio para estudiantes
                        que provienen de instituciones externas y aspiran a <strong>{gradeLabel}</strong>.
                        Su objetivo es verificar que el estudiante posee las competencias académicas básicas
                        para integrarse exitosamente al nivel solicitado.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                        <div className="rounded-lg border p-3 space-y-1">
                            <p className="font-semibold text-foreground">Duración</p>
                            <p>Un mes — del 1 de abril al 1 de mayo de 2026</p>
                        </div>
                        <div className="rounded-lg border p-3 space-y-1">
                            <p className="font-semibold text-foreground">Modalidad</p>
                            <p>Virtual — sesiones en vivo por Microsoft Teams</p>
                        </div>
                        <div className="rounded-lg border p-3 space-y-1">
                            <p className="font-semibold text-foreground">Asistencia mínima</p>
                            <p>80% de las sesiones por materia</p>
                        </div>
                        <div className="rounded-lg border p-3 space-y-1">
                            <p className="font-semibold text-foreground">Nota mínima para aprobar</p>
                            <p>7 / 10 puntos por materia</p>
                        </div>
                    </div>

                    <Alert className="border-amber-200 bg-amber-50 mt-2">
                        <Info className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-800">
                            Debe aprobar <strong>todas</strong> las materias. El incumplimiento de
                            asistencia o nota en cualquiera de ellas implica la reprobación y la
                            liberación del cupo solicitado.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>

            {/* Enrollment status */}
            {isCursilloStatus && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Award className="h-5 w-5" />
                                Estado por Materia
                            </CardTitle>
                            {totalSubjects > 0 && (
                                <Badge variant="outline" className="text-sm">
                                    {evaluatedSubjects} / {totalSubjects} evaluadas
                                </Badge>
                            )}
                        </div>
                        {totalSubjects > 0 && (
                            <div className="mt-2">
                                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                    <span>Progreso de evaluación</span>
                                    <span>{Math.round((evaluatedSubjects / totalSubjects) * 100)}%</span>
                                </div>
                                <Progress value={(evaluatedSubjects / totalSubjects) * 100} className="h-2" />
                            </div>
                        )}
                    </CardHeader>
                    <CardContent>
                        {enrollments.length === 0 ? (
                            <p className="text-center py-6 text-muted-foreground text-sm">
                                Las inscripciones por materia aún no han sido registradas.
                                Secretaría las cargará próximamente.
                            </p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Materia</TableHead>
                                        <TableHead className="text-center">Asistencia</TableHead>
                                        <TableHead className="text-center">Nota</TableHead>
                                        <TableHead className="text-center">Resultado</TableHead>
                                        <TableHead className="text-center">Sesión Teams</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {enrollments.map((enr) => {
                                        const attendancePercent = enr.session.totalSessions > 0
                                            ? Math.round((enr.attendedSessions / enr.session.totalSessions) * 100)
                                            : 0;

                                        return (
                                            <TableRow key={enr.id}>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{enr.session.subject}</p>
                                                        {enr.session.teacherName && (
                                                            <p className="text-xs text-muted-foreground">
                                                                {enr.session.teacherName}
                                                            </p>
                                                        )}
                                                        {enr.session.sessionSchedule && (
                                                            <p className="text-xs text-muted-foreground">
                                                                {enr.session.sessionSchedule}
                                                            </p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-medium">
                                                            {enr.attendedSessions} / {enr.session.totalSessions}
                                                        </p>
                                                        <p className={`text-xs font-medium ${attendancePercent >= 80 ? 'text-green-600' : 'text-red-500'}`}>
                                                            {attendancePercent}%
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {enr.score !== null ? (
                                                        <span className={`font-bold text-lg ${enr.score >= 7 ? 'text-green-600' : 'text-red-500'}`}>
                                                            {Number(enr.score).toFixed(2)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {enr.passed === true && (
                                                        <Badge className="bg-green-100 text-green-800 border-green-300">
                                                            Aprobado
                                                        </Badge>
                                                    )}
                                                    {enr.passed === false && (
                                                        <Badge variant="destructive">Reprobado</Badge>
                                                    )}
                                                    {enr.passed === null && (
                                                        <Badge variant="outline" className="text-muted-foreground">
                                                            Pendiente
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {enr.session.teamsLink && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            asChild
                                                            className="border-blue-300 text-blue-700 hover:bg-blue-50"
                                                        >
                                                            <a
                                                                href={enr.session.teamsLink}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                <Video className="h-3 w-3 mr-1" />
                                                                Unirse
                                                                <ExternalLink className="h-3 w-3 ml-1" />
                                                            </a>
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Subject details */}
            {enrollments.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5" />
                            Descripción de Materias
                        </CardTitle>
                        <CardDescription>
                            Contenidos y horarios de cada materia del cursillo
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {enrollments.map((enr, i) => (
                            <div key={enr.id}>
                                {i > 0 && <Separator className="my-4" />}
                                <div className="space-y-2">
                                    <div className="flex items-start justify-between">
                                        <h4 className="font-semibold">{enr.session.subject}</h4>
                                        {enr.session.teacherName && enr.session.teacherName !== 'Por asignar' && (
                                            <span className="text-sm text-muted-foreground">{enr.session.teacherName}</span>
                                        )}
                                    </div>
                                    {enr.session.description && (
                                        <p className="text-sm text-muted-foreground">{enr.session.description}</p>
                                    )}
                                    <div className="flex flex-wrap gap-3 text-xs">
                                        {enr.session.sessionSchedule && (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted">
                                                <Clock className="h-3 w-3" />
                                                {enr.session.sessionSchedule}
                                            </span>
                                        )}
                                        {enr.session.startDate && enr.session.endDate && (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted">
                                                {format(new Date(enr.session.startDate), 'd MMM', { locale: es })}
                                                {' — '}
                                                {format(new Date(enr.session.endDate), 'd MMM yyyy', { locale: es })}
                                            </span>
                                        )}
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted">
                                            {enr.session.totalSessions} sesiones
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Teams join button — visible when cursillo is active */}
            {application.status === 'CURSILLO_SCHEDULED' && enrollments.length > 0 && (
                <Card className="border-blue-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Video className="h-5 w-5 text-blue-600" />
                            Acceso a las Sesiones
                        </CardTitle>
                        <CardDescription>
                            Todas las sesiones se realizan por Microsoft Teams. Use el mismo enlace para todas las materias.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            asChild
                            size="lg"
                            className="w-full bg-[#5a2d82] hover:bg-[#4a2169] text-white"
                        >
                            <a
                                href="https://teams.microsoft.com/meet/24893552174366?p=sbOFw5Mv0IROZbyY0H"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Video className="mr-2 h-5 w-5" />
                                Unirse a Microsoft Teams
                                <ExternalLink className="ml-2 h-4 w-4" />
                            </a>
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                            Se requiere la aplicación Microsoft Teams (escritorio o móvil)
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Not in cursillo state */}
            {!isCursilloStatus && (
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Sin cursillo activo</AlertTitle>
                    <AlertDescription>
                        Esta solicitud no se encuentra en proceso de cursillo actualmente.
                        Estado actual: <strong>{STATUS_LABELS[application.status]}</strong>.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
