'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import {
  getCursilloSessions,
  getCursilloStats,
  updateCursilloSession,
  notifyCursilloSessionEnrolled,
} from '@/lib/api-cursillo';
import { getAllApplications } from '@/lib/api-admin-applications';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  GraduationCap,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  LinkIcon,
  Pencil,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  BellRing,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

interface CursilloSession {
  id: string;
  subject: string;
  subjectCode: string;
  gradeLevel: string;
  specialty: string | null;
  teacherName: string | null;
  teacherEmail: string | null;
  teamsLink: string;
  startDate: string | null;
  endDate: string | null;
  totalSessions: number;
  sessionSchedule: string | null;
  academicYear: string;
  isActive: boolean;
  description: string | null;
  enrollments: {
    id: string;
    attendedSessions: number;
    score: number | null;
    passed: boolean | null;
    application: {
      id: string;
      studentFirstName: string;
      studentLastName: string;
      studentCedula: string;
      gradeLevel: string;
      specialty: string | null;
      status: string;
    };
  }[];
}

const GRADE_LABELS: Record<string, string> = {
  '8vo_basico': '8vo Básico',
  '1ro_bachillerato': '1ro Bachillerato',
  '8vo EGB': '8vo Básico',
  '1ero BGU': '1ro Bachillerato',
};

const SUBJECT_COLORS: Record<string, string> = {
  LENGUA: 'bg-purple-100 text-purple-800',
  MATE: 'bg-blue-100 text-blue-800',
  MATE_BGU: 'bg-blue-100 text-blue-800',
  INGLES: 'bg-green-100 text-green-800',
  FISICA: 'bg-orange-100 text-orange-800',
  QUIMICA: 'bg-red-100 text-red-800',
  PROGRAMACION: 'bg-cyan-100 text-cyan-800',
};

export default function AdminCursillosPage() {
  const { data: session } = useSession();
  // @ts-expect-error - accessToken is added in next-auth callbacks
  const token = session?.accessToken || (session?.user as { accessToken?: string })?.accessToken;

  const [sessions, setSessions] = useState<CursilloSession[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editSession, setEditSession] = useState<CursilloSession | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    teacherName: '',
    teacherEmail: '',
    teamsLink: '',
    sessionSchedule: '',
    totalSessions: 4,
    startDate: '',
    endDate: '',
    description: '',
  });

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [sessData, statsData, appsData] = await Promise.all([
        getCursilloSessions(token),
        getCursilloStats(token),
        getAllApplications(token, {
          gradeLevel: undefined,
          page: 1,
          limit: 200,
        }),
      ]);
      setSessions(sessData);
      setStats(statsData);
      // Solo apps que aplican para cursillo y no son DRAFT/REJECTED básicos
      const CURSILLO_GRADES = ['8vo_basico', '1ro_bachillerato', '8vo EGB', '1ero BGU'];
      const filtered = (appsData.data || []).filter((app: any) =>
        CURSILLO_GRADES.includes(app.gradeLevel || '') &&
        !['DRAFT', 'SUBMITTED'].includes(app.status)
      );
      setApplications(filtered);
    } catch (err) {
      toast.error('Error al cargar datos del cursillo');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openEdit = (s: CursilloSession) => {
    setEditSession(s);
    setEditForm({
      teacherName: s.teacherName || '',
      teacherEmail: s.teacherEmail || '',
      teamsLink: s.teamsLink || '',
      sessionSchedule: s.sessionSchedule || '',
      totalSessions: s.totalSessions,
      startDate: s.startDate ? s.startDate.slice(0, 10) : '',
      endDate: s.endDate ? s.endDate.slice(0, 10) : '',
      description: s.description || '',
    });
  };

  const handleSaveSession = async () => {
    if (!editSession) return;
    setEditLoading(true);
    try {
      await updateCursilloSession(token, editSession.id, {
        teacherName: editForm.teacherName || undefined,
        teacherEmail: editForm.teacherEmail || undefined,
        teamsLink: editForm.teamsLink || undefined,
        sessionSchedule: editForm.sessionSchedule || undefined,
        totalSessions: editForm.totalSessions,
        startDate: editForm.startDate || undefined,
        endDate: editForm.endDate || undefined,
        description: editForm.description || undefined,
      });
      toast.success('Sesión actualizada correctamente');
      setEditSession(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar sesión');
    } finally {
      setEditLoading(false);
    }
  };

  const handleNotifyEnrolled = async (sessionId: string) => {
    if (!token) return;
    if (!confirm('¿Seguro de que deseas notificar a todos los inscritos en esta materia sobre actualizaciones de horario, profesor y fecha?')) return;
    try {
      const resp = await notifyCursilloSessionEnrolled(token, sessionId);
      toast.success(`Se enviaron notificaciones a ${resp.notified} apoderados.`);
    } catch (err: any) {
      toast.error(err.message || 'Error al notificar');
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; class: string }> = {
      APPROVED: { label: 'Aprobado', class: 'bg-emerald-100 text-emerald-800' },
      CURSILLO_SCHEDULED: { label: 'Programado', class: 'bg-blue-100 text-blue-800' },
      CURSILLO_APPROVED: { label: 'Cursillo ✓', class: 'bg-green-100 text-green-800' },
      CURSILLO_REJECTED: { label: 'Reprobó', class: 'bg-red-100 text-red-800' },
      UNDER_REVIEW: { label: 'En Revisión', class: 'bg-yellow-100 text-yellow-800' },
      PAYMENT_UPLOADED: { label: 'Pago Subido', class: 'bg-purple-100 text-purple-800' },
      PAYMENT_VALIDATED: { label: 'Matriculación', class: 'bg-indigo-100 text-indigo-800' },
    };
    const s = map[status] || { label: status, class: 'bg-gray-100 text-gray-800' };
    return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.class}`}>{s.label}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  // Agrupar por grado
  const sessions8vo = sessions.filter(s => s.gradeLevel === '8vo_basico');
  const sessions1ro = sessions.filter(s => s.gradeLevel === '1ro_bachillerato');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Cursillos</h1>
          <p className="text-muted-foreground mt-1">
            Administra las materias, docentes y evaluaciones del cursillo de admisión · Del 1 de abril al 1 de mayo 2026
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.requireCursillo}</p>
                  <p className="text-xs text-muted-foreground">Requieren cursillo</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.scheduled + stats.pending}</p>
                  <p className="text-xs text-muted-foreground">En cursillo</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.approved}</p>
                  <p className="text-xs text-muted-foreground">Aprobaron</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.rejected}</p>
                  <p className="text-xs text-muted-foreground">Reprobaron</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="sessions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sessions">
            <BookOpen className="h-4 w-4 mr-2" />
            Materias / Sesiones
          </TabsTrigger>
          <TabsTrigger value="students">
            <Users className="h-4 w-4 mr-2" />
            Aspirantes ({applications.length})
          </TabsTrigger>
        </TabsList>

        {/* ====== TAB: SESIONES ====== */}
        <TabsContent value="sessions" className="space-y-6">
          {/* 8vo Básico */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">8vo Básico</h2>
              <Badge variant="secondary">3 materias</Badge>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {sessions8vo.map(s => (
                <SessionCard key={s.id} session={s} onEdit={openEdit} onNotify={handleNotifyEnrolled} />
              ))}
              {sessions8vo.length === 0 && (
                <p className="text-muted-foreground col-span-3 text-sm">No hay sesiones configuradas</p>
              )}
            </div>
          </div>

          <Separator />

          {/* 1ro Bachillerato */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">1ro Bachillerato</h2>
              <Badge variant="secondary">3 materias base + Programación (Técnico Informática)</Badge>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {sessions1ro.map(s => (
                <SessionCard key={s.id} session={s} onEdit={openEdit} onNotify={handleNotifyEnrolled} />
              ))}
              {sessions1ro.length === 0 && (
                <p className="text-muted-foreground col-span-4 text-sm">No hay sesiones configuradas</p>
              )}
            </div>
          </div>

          {/* Info de criterios */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-4">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-800 mb-1">Criterios de aprobación del cursillo</p>
                  <ul className="space-y-1 text-amber-700">
                    <li>• <strong>Asistencia mínima:</strong> 80% de las clases programadas</li>
                    <li>• <strong>Nota mínima:</strong> 7 / 10 por materia</li>
                    <li>• El estudiante debe superar <strong>TODAS</strong> las materias para aprobar el cursillo</li>
                    <li>• Enlace Teams para todas las sesiones:
                      <a
                        href="https://teams.microsoft.com/meet/24893552174366?p=sbOFw5Mv0IROZbyY0H"
                        target="_blank"
                        className="ml-1 text-blue-600 underline font-medium"
                      >
                        Ingresar al Teams
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ====== TAB: ESTUDIANTES ====== */}
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Aspirantes que requieren cursillo</CardTitle>
              <CardDescription>
                Estudianates de 8vo Básico y 1ro Bachillerato de instituciones externas (no UEFDB)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="mx-auto h-12 w-12 opacity-20 mb-2" />
                  <p>No hay aspirantes con cursillo pendiente</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Estudiante</TableHead>
                      <TableHead>Grado / Especialidad</TableHead>
                      <TableHead>Institución anterior</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map(app => (
                      <TableRow key={app.id}>
                        <TableCell>
                          <div className="font-medium">{app.studentFirstName} {app.studentLastName}</div>
                          <div className="text-xs text-muted-foreground">{app.studentCedula}</div>
                        </TableCell>
                        <TableCell>
                          <div>{GRADE_LABELS[app.gradeLevel] || app.gradeLevel}</div>
                          {app.specialty && (
                            <div className="text-xs text-muted-foreground">{app.specialty}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{app.previousSchool || '—'}</span>
                        </TableCell>
                        <TableCell>{getStatusBadge(app.status)}</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/admin/admisiones/${app.id}`}>
                            <Button variant="ghost" size="sm">
                              Ver detalle <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: Editar Sesión */}
      <Dialog open={!!editSession} onOpenChange={(o) => !o && setEditSession(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Sesión: {editSession?.subject}</DialogTitle>
            <DialogDescription>
              {editSession?.gradeLevel ? GRADE_LABELS[editSession.gradeLevel] : ''} ·{' '}
              {editSession?.specialty ? `Solo: ${editSession.specialty}` : 'Todas las especialidades'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Docente</Label>
                <Input
                  placeholder="Nombre del docente"
                  value={editForm.teacherName}
                  onChange={e => setEditForm(p => ({ ...p, teacherName: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Email del docente</Label>
                <Input
                  placeholder="docente@uefdb.edu.ec"
                  type="email"
                  value={editForm.teacherEmail}
                  onChange={e => setEditForm(p => ({ ...p, teacherEmail: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Enlace Teams</Label>
              <Input
                value={editForm.teamsLink}
                onChange={e => setEditForm(p => ({ ...p, teamsLink: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label>Horario (ej: Lunes y Miércoles 15:00-17:00)</Label>
              <Input
                placeholder="Lunes y Miércoles 15:00-17:00"
                value={editForm.sessionSchedule}
                onChange={e => setEditForm(p => ({ ...p, sessionSchedule: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Total de clases</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={editForm.totalSessions}
                  onChange={e => setEditForm(p => ({ ...p, totalSessions: parseInt(e.target.value) || 4 }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Fecha inicio</Label>
                <Input
                  type="date"
                  value={editForm.startDate}
                  onChange={e => setEditForm(p => ({ ...p, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Fecha fin</Label>
                <Input
                  type="date"
                  value={editForm.endDate}
                  onChange={e => setEditForm(p => ({ ...p, endDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Descripción</Label>
              <Input
                value={editForm.description}
                onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSession(null)}>Cancelar</Button>
            <Button onClick={handleSaveSession} disabled={editLoading}>
              {editLoading ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SessionCard({ session, onEdit, onNotify }: { session: CursilloSession; onEdit: (s: CursilloSession) => void; onNotify: (id: string) => void }) {
  const colorClass = SUBJECT_COLORS[session.subjectCode] || 'bg-gray-100 text-gray-800';
  const enrolled = session.enrollments.length;
  const approved = session.enrollments.filter(e => e.passed === true).length;
  const rejected = session.enrollments.filter(e => e.passed === false).length;

  return (
    <Card className={`relative overflow-hidden ${!session.isActive ? 'opacity-60' : ''}`}>
      <div className={`absolute top-0 left-0 w-1 h-full ${session.isActive ? 'bg-primary' : 'bg-gray-300'}`} />
      <CardHeader className="pb-2 pl-5">
        <div className="flex items-start justify-between">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colorClass}`}>
            {session.subject}
          </span>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={() => onNotify(session.id)} title="Notificar a inscritos">
              <BellRing className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(session)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        {session.specialty && (
          <p className="text-xs text-muted-foreground mt-1">Solo: {session.specialty}</p>
        )}
      </CardHeader>
      <CardContent className="pl-5 space-y-2">
        <div className="text-sm space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{session.teacherName || <span className="italic text-amber-600">Sin docente asignado</span>}</span>
          </div>
          {session.startDate && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>
                {format(new Date(session.startDate), 'd MMM', { locale: es })} –{' '}
                {session.endDate ? format(new Date(session.endDate), 'd MMM yyyy', { locale: es }) : '—'}
              </span>
            </div>
          )}
          {session.sessionSchedule && (
            <p className="text-xs text-muted-foreground">{session.sessionSchedule}</p>
          )}
          <a
            href={session.teamsLink}
            target="_blank"
            className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            <LinkIcon className="h-3 w-3" />
            Enlace Teams
          </a>
        </div>

        <Separator />

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{enrolled} inscritos</span>
          <div className="flex gap-2">
            {approved > 0 && <span className="text-green-600 font-medium">{approved} ✓</span>}
            {rejected > 0 && <span className="text-red-600 font-medium">{rejected} ✗</span>}
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          {session.totalSessions} clases · {session.description || session.subjectCode}
        </div>
      </CardContent>
    </Card>
  );
}
