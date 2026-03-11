'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getUsers } from '@/lib/api-users';
import { User as UserType } from '@/types/user';
import {
  getApplicationDetail, putUnderReview, requestCorrections, approveApplication,
  rejectApplication, assignToDirectivo, addInternalComment, downloadApplicationPdf,
  getAvailableParallels, assignParallel, validatePayment, adminRemoveApplication,
} from '@/lib/api-admin-applications';
import { getApplicationEnrollments, updateCursilloEnrollment, enrollApplicationInCursillo, finalizeCursillo } from '@/lib/api-cursillo';
import { Application, STATUS_LABELS, STATUS_COLORS, DOCUMENT_LABELS, GRADE_LEVELS } from '@/types/application';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowLeft, User, GraduationCap, Users, FileText, Eye,
  CheckCircle, XCircle, AlertTriangle, Loader2, Clock,
  MessageSquare, UserPlus, Send, Printer, Shield, CreditCard,
  FileCheck, BookOpen, LinkIcon, Trash2, CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRoles } from '@/hooks/use-roles';

function requiresCursillo(gradeLevel?: string | null, previousSchool?: string | null): boolean {
  if (!gradeLevel) return false;
  // Soporta formato nuevo (labels) y legado (DB codes)
  const needsCursillo = ['8vo EGB', '1ero BGU', '8vo_basico', '1ro_bachillerato'].includes(gradeLevel);
  if (!needsCursillo) return false;
  if (!previousSchool) return true;
  const school = previousSchool.toUpperCase();
  return !['DON BOSCO', 'UEFDB', 'FISCOMISIONAL DON BOSCO'].some(kw => school.includes(kw));
}

function getFileUrl(url?: string | null) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/+$/, '');
  return `${baseUrl}/${url.replace(/^\/+/, '')}`;
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[60%]">{value || '—'}</span>
    </div>
  );
}

interface Props { params: Promise<{ id: string }>; }

export default function ApplicationDetailPage({ params }: Props) {
  const { id } = use(params);
  const { data: session } = useSession();
  const { isSuperAdmin } = useRoles();
  const router = useRouter();
  // @ts-expect-error - accessToken is added in next-auth callbacks
  const token = session?.accessToken || (session?.user as { accessToken?: string })?.accessToken;

  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Forms
  const [correctionText, setCorrectionText] = useState('');
  const [rejectionText, setRejectionText] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [newComment, setNewComment] = useState('');
  const [directivoId, setDirectivoId] = useState('');
  const [directivos, setDirectivos] = useState<UserType[]>([]);
  const [paymentRejectionReason, setPaymentRejectionReason] = useState('');

  // Parallels
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [parallels, setParallels] = useState<{ parallel: string; available: number; totalQuota: number; used: number }[]>([]);
  const [selectedParallel, setSelectedParallel] = useState('');
  const [loadingParallels, setLoadingParallels] = useState(false);

  // Dialogs
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [correctionDialogOpen, setCorrectionDialogOpen] = useState(false);

  // Cursillo
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [enrollEdits, setEnrollEdits] = useState<Record<string, { attendedSessions: number; score: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);

  const loadApp = useCallback(async () => {
    if (!token || !id) return;
    try {
      const [data, dirs] = await Promise.all([
        getApplicationDetail(token, id),
        getUsers(token, 'rector').catch(() => [])
      ]);
      setApplication(data);
      setDirectivos(dirs || []);
      if (data.assignedToId) setDirectivoId(data.assignedToId);
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar solicitud');
      router.push('/admin/admisiones');
    } finally {
      setLoading(false);
    }
  }, [token, id, router]);

  useEffect(() => { loadApp(); }, [loadApp]);

  const loadEnrollments = useCallback(async () => {
    if (!token || !id) return;
    setLoadingEnrollments(true);
    try {
      const data = await getApplicationEnrollments(token, id);
      setEnrollments(data);
      const edits: Record<string, { attendedSessions: number; score: string }> = {};
      data.forEach((e: any) => {
        edits[e.id] = { attendedSessions: e.attendedSessions ?? 0, score: e.score !== null ? String(e.score) : '' };
      });
      setEnrollEdits(edits);
    } catch { /* silent */ } finally { setLoadingEnrollments(false); }
  }, [token, id]);

  const handleDownloadPdf = async () => {
    if (!token || !application) return;
    setPdfLoading(true);
    try {
      const fullName = `${application.studentLastName || ''}_${application.studentFirstName || ''}`;
      await downloadApplicationPdf(token, application.id, fullName, application.studentCedula || undefined);
      toast.success('PDF generado correctamente');
    } catch (err: any) {
      toast.error(err.message || 'Error al generar PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const wrap = (fn: () => Promise<Application | void>) => async () => {
    setActionLoading(true);
    try { const r = await fn(); if (r) setApplication(r as Application); }
    catch (err: any) { toast.error(err.message || 'Error'); }
    finally { setActionLoading(false); }
  };

  const handlePutUnderReview = wrap(async () => { const r = await putUnderReview(token, application!.id); toast.success('Marcado como En Revisión'); return r; });
  const handleApprove = wrap(async () => { const r = await approveApplication(token, application!.id, approvalNotes); toast.success('✅ Solicitud aprobada'); setApprovalNotes(''); setApproveDialogOpen(false); return r; });
  const handleReject = wrap(async () => {
    if (!rejectionText.trim()) { toast.error('Ingrese el motivo de rechazo'); return; }
    const r = await rejectApplication(token, application!.id, rejectionText); toast.success('Solicitud rechazada'); setRejectionText(''); setRejectDialogOpen(false); return r;
  });
  const handleCorrections = wrap(async () => {
    if (!correctionText.trim()) { toast.error('Ingrese las correcciones'); return; }
    const r = await requestCorrections(token, application!.id, correctionText); toast.success('Correcciones solicitadas'); setCorrectionText(''); setCorrectionDialogOpen(false); return r;
  });
  const handleAddComment = wrap(async () => {
    if (!newComment.trim()) return;
    const r = await addInternalComment(token, application!.id, newComment); toast.success('Comentario agregado'); setNewComment(''); return r;
  });
  const handleAssign = wrap(async () => {
    if (!directivoId) return;
    const r = await assignToDirectivo(token, application!.id, directivoId); toast.success('Solicitud asignada'); return r;
  });
  const handleValidatePaymentApprove = wrap(async () => {
    const r = await validatePayment(token, application!.id, true); toast.success('Pago validado'); return r;
  });
  const handleValidatePaymentReject = wrap(async () => {
    if (!paymentRejectionReason.trim()) { toast.error('Ingrese el motivo'); return; }
    const r = await validatePayment(token, application!.id, false, paymentRejectionReason); toast.success('Pago rechazado'); setPaymentRejectionReason(''); return r;
  });
  const handleAdminRemove = wrap(async () => {
    if (!confirm(`¿Eliminar solicitud de ${application!.studentFirstName} ${application!.studentLastName}? Esta acción es irreversible.`)) return;
    await adminRemoveApplication(token, application!.id); toast.success('Solicitud eliminada. Cupo liberado.'); router.push('/admin/admisiones');
  });

  const handleOpenAssign = async () => {
    if (!token || !application) return;
    setLoadingParallels(true);
    try { const data = await getAvailableParallels(token, application.id); setParallels(data); setAssignDialogOpen(true); }
    catch (err: any) { toast.error(err.message); } finally { setLoadingParallels(false); }
  };
  const handleConfirmAssign = async () => {
    if (!token || !application || !selectedParallel) return;
    setActionLoading(true);
    try {
      const updated = await assignParallel(token, application.id, selectedParallel);
      setApplication(updated); toast.success(`Matriculado en paralelo ${selectedParallel}`); setAssignDialogOpen(false);
    } catch (err: any) { toast.error(err.message); } finally { setActionLoading(false); }
  };

  const handleEnrollCursillo = async () => {
    if (!token || !application) return;
    setActionLoading(true);
    try {
      await enrollApplicationInCursillo(token, application.id);
      toast.success('Inscrito en materias del cursillo');
      await loadEnrollments();
      await loadApp();
    } catch (err: any) { toast.error(err.message || 'Error'); } finally { setActionLoading(false); }
  };

  const handleSaveEnrollment = async (enrollmentId: string) => {
    if (!token) return;
    const edit = enrollEdits[enrollmentId];
    setSavingId(enrollmentId);
    try {
      await updateCursilloEnrollment(token, enrollmentId, {
        attendedSessions: edit.attendedSessions,
        score: edit.score !== '' ? parseFloat(edit.score) : undefined,
      });
      toast.success('Guardado'); await loadEnrollments();
    } catch (err: any) { toast.error(err.message || 'Error'); } finally { setSavingId(null); }
  };

  const handleFinalize = async () => {
    if (!token || !application) return;
    setFinalizing(true);
    try {
      const result = await finalizeCursillo(token, application.id);
      toast.success(result.passed ? '🎉 Cursillo APROBADO' : '❌ Cursillo REPROBADO');
      await loadApp(); await loadEnrollments();
    } catch (err: any) { toast.error(err.message || 'Error'); } finally { setFinalizing(false); }
  };

  if (loading || !application) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const gradeLabel = GRADE_LEVELS.find(g => g.value === application.gradeLevel)?.label || application.gradeLevel;
  const needsCursillo = requiresCursillo(application.gradeLevel, application.previousSchool);
  const isCursilloFinal = ['CURSILLO_APPROVED', 'CURSILLO_REJECTED'].includes(application.status);
  const allEvaluated = enrollments.length > 0 && enrollments.every((e: any) => e.score !== null);

  const averageDisplay = application.lastYearAverage ? Number(application.lastYearAverage).toFixed(2) : '—';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/admisiones"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={pdfLoading}>
            {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4 mr-1" />}
            {!pdfLoading && 'PDF'}
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{application.studentFirstName} {application.studentLastName}</h1>
            <p className="text-muted-foreground text-sm">Solicitud para {gradeLabel}{application.specialty ? ` · ${application.specialty}` : ''}</p>
          </div>
        </div>
        <Badge className={`${STATUS_COLORS[application.status]} text-sm px-3 py-1`}>
          {STATUS_LABELS[application.status] || application.status}
        </Badge>
      </div>

      {/* Acciones principales */}
      <Card>
        <CardContent className="p-4 flex flex-wrap gap-2">
          {application.status === 'SUBMITTED' && (
            <Button size="sm" onClick={handlePutUnderReview} disabled={actionLoading}>Poner en Revisión</Button>
          )}
          {['SUBMITTED', 'UNDER_REVIEW'].includes(application.status) && (
            <>
              <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-4 w-4 mr-1" /> Aprobar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Aprobar Solicitud</DialogTitle>
                    <DialogDescription>
                      ¿Está seguro de aprobar la solicitud de {application.studentFirstName} {application.studentLastName}?
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2">
                    <Label htmlFor="approval-notes">Notas de Aprobación (Opcional)</Label>
                    <Textarea
                      id="approval-notes"
                      placeholder="Agregar observaciones o notas..."
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>Cancelar</Button>
                    <Button className="bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={actionLoading}>
                      {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Aprobar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="destructive">
                    <XCircle className="h-4 w-4 mr-1" /> Rechazar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Rechazar Solicitud</DialogTitle>
                    <DialogDescription>
                      Indique el motivo del rechazo. Esta información será visible para el apoderado.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2">
                    <Label htmlFor="rejection-reason">Motivo de Rechazo *</Label>
                    <Textarea
                      id="rejection-reason"
                      placeholder="Explique el motivo del rechazo..."
                      value={rejectionText}
                      onChange={(e) => setRejectionText(e.target.value)}
                      rows={4}
                      required
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => { setRejectDialogOpen(false); setRejectionText(''); }}>Cancelar</Button>
                    <Button variant="destructive" onClick={handleReject} disabled={actionLoading || !rejectionText.trim()}>
                      {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Rechazar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={correctionDialogOpen} onOpenChange={setCorrectionDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <AlertTriangle className="h-4 w-4 mr-1" /> Pedir Corrección
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Solicitar Correcciones</DialogTitle>
                    <DialogDescription>
                      Especifique qué información debe corregir el apoderado. Esto será visible para él.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2">
                    <Label htmlFor="correction-text">Correcciones Solicitadas *</Label>
                    <Textarea
                      id="correction-text"
                      placeholder="Liste las correcciones necesarias..."
                      value={correctionText}
                      onChange={(e) => setCorrectionText(e.target.value)}
                      rows={4}
                      required
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => { setCorrectionDialogOpen(false); setCorrectionText(''); }}>Cancelar</Button>
                    <Button onClick={handleCorrections} disabled={actionLoading || !correctionText.trim()}>
                      {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Enviar Solicitud
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
          {application.status === 'APPROVED' && needsCursillo && (
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={handleEnrollCursillo}>
              <BookOpen className="h-4 w-4 mr-1" /> Inscribir en Cursillo
            </Button>
          )}
          {['PAYMENT_VALIDATED', 'CURSILLO_APPROVED'].includes(application.status) && (
            <Button size="sm" onClick={handleOpenAssign} className="bg-purple-600 hover:bg-purple-700">Asignar Paralelo</Button>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="info">
        <TabsList className="h-auto flex-wrap gap-1">
          <TabsTrigger value="info"><User className="h-3.5 w-3.5 mr-1" />Información</TabsTrigger>
          <TabsTrigger value="documents"><FileText className="h-3.5 w-3.5 mr-1" />Documentos</TabsTrigger>
          {needsCursillo && (
            <TabsTrigger value="cursillo" onClick={() => { if (enrollments.length === 0) loadEnrollments(); }}>
              <BookOpen className="h-3.5 w-3.5 mr-1" />Cursillo
            </TabsTrigger>
          )}
          <TabsTrigger value="pago"><CreditCard className="h-3.5 w-3.5 mr-1" />Pago</TabsTrigger>
          <TabsTrigger value="gestion"><MessageSquare className="h-3.5 w-3.5 mr-1" />Gestión</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Datos Estudiante */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Datos del Estudiante</CardTitle>
                {(() => {
                  const photoDoc = application.documents?.find(d => d.documentType === 'STUDENT_PHOTO');
                  if (!photoDoc) return null;
                  return (
                    <div className="h-20 w-20 rounded-full overflow-hidden border-2 bg-muted">
                      <img src={getFileUrl(photoDoc.fileUrl)} alt="Foto" className="h-full w-full object-cover" />
                    </div>
                  );
                })()}
              </CardHeader>
              <CardContent className="space-y-2">
                <InfoRow label="Tipo" value={application.enrollmentType === 'NEW_STUDENT' ? 'Nuevo Estudiante' : application.enrollmentType === 'RETURNING_STUDENT' ? 'Reingreso' : '—'} />
                <InfoRow label="Nombres Completos" value={`${application.studentFirstName} ${application.studentLastName}`} />
                <InfoRow label="Cédula" value={application.studentCedula} />
                <InfoRow label="Fecha de Nacimiento" value={application.studentBirthDate ? format(new Date(application.studentBirthDate), 'dd/MM/yyyy', { locale: es }) : '—'} />
                <InfoRow label="Género" value={application.studentGender === 'M' ? 'Masculino' : application.studentGender === 'F' ? 'Femenino' : application.studentGender || '—'} />
                <InfoRow label="Nacionalidad" value={application.studentNationality} />
                <InfoRow label="Email" value={application.studentEmail} />
                <InfoRow label="Teléfono" value={application.studentPhone} />
              </CardContent>
            </Card>

            {/* Lugar de Nacimiento */}
            {application.studentBirthPlace && (
              <Card>
                <CardHeader><CardTitle className="text-base">Lugar de Nacimiento</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <InfoRow label="País" value={(application.studentBirthPlace as any).country} />
                  <InfoRow label="Provincia" value={(application.studentBirthPlace as any).province} />
                  <InfoRow label="Cantón" value={(application.studentBirthPlace as any).canton} />
                  <InfoRow label="Ciudad" value={(application.studentBirthPlace as any).city} />
                  <InfoRow label="Parroquia" value={(application.studentBirthPlace as any).parish} />
                </CardContent>
              </Card>
            )}

            {/* Dirección */}
            <Card>
              <CardHeader><CardTitle className="text-base">Domicilio</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <InfoRow label="Dirección" value={application.studentAddress} />
                <InfoRow label="Sector" value={application.studentSector} />
              </CardContent>
            </Card>

            {/* Datos Médicos */}
            <Card>
              <CardHeader><CardTitle className="text-base">Información Médica</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <InfoRow label="Tipo de Sangre" value={application.bloodType} />
                <InfoRow label="Tiene Discapacidad" value={application.hasDisability ? 'Sí' : 'No'} />
                {application.hasDisability && application.disabilityDetail && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Detalle:</span>
                    <p className="font-medium mt-1 p-2 bg-amber-50 rounded border border-amber-200">{application.disabilityDetail}</p>
                  </div>
                )}
                <InfoRow label="Requiere Cuidados Especiales" value={application.needsSpecialCare ? 'Sí' : 'No'} />
                {application.needsSpecialCare && application.specialCareDetail && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Detalle:</span>
                    <p className="font-medium mt-1 p-2 bg-blue-50 rounded border border-blue-200">{application.specialCareDetail}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Datos Académicos */}
            <Card>
              <CardHeader><CardTitle className="text-base">Información Académica</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <InfoRow label="Nivel a Matricular" value={gradeLabel} />
                <InfoRow label="Jornada" value={application.shift} />
                {application.specialty && <InfoRow label="Especialidad" value={application.specialty} />}
                <InfoRow label="Institución Anterior" value={application.previousSchool} />
                <InfoRow label="Promedio Año Anterior" value={averageDisplay} />
                <InfoRow label="Ha Repetido Año" value={application.hasRepeatedYear ? 'Sí' : 'No'} />
                {application.hasRepeatedYear && application.repeatedYearDetail && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Detalle:</span>
                    <p className="font-medium mt-1 p-2 bg-slate-50 rounded border">{application.repeatedYearDetail}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Datos del Padre */}
            {application.fatherData && (
              <Card>
                <CardHeader><CardTitle className="text-base">Datos del Padre</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <InfoRow label="Nombres" value={(application.fatherData as any).names} />
                  <InfoRow label="Cédula" value={(application.fatherData as any).cedula} />
                  <InfoRow label="Teléfono" value={(application.fatherData as any).phone} />
                  <InfoRow label="Email" value={(application.fatherData as any).email} />
                  <InfoRow label="Ocupación" value={(application.fatherData as any).occupation} />
                  <InfoRow label="Lugar de Trabajo" value={(application.fatherData as any).workPlace} />
                  <InfoRow label="Dirección Trabajo" value={(application.fatherData as any).workAddress} />
                  <InfoRow label="Teléfono Trabajo" value={(application.fatherData as any).workPhone} />
                  <InfoRow label="Vive con el Estudiante" value={(application.fatherData as any).livesWithStudent ? 'Sí' : 'No'} />
                </CardContent>
              </Card>
            )}

            {/* Datos de la Madre */}
            {application.motherData && (
              <Card>
                <CardHeader><CardTitle className="text-base">Datos de la Madre</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <InfoRow label="Nombres" value={(application.motherData as any).names} />
                  <InfoRow label="Cédula" value={(application.motherData as any).cedula} />
                  <InfoRow label="Teléfono" value={(application.motherData as any).phone} />
                  <InfoRow label="Email" value={(application.motherData as any).email} />
                  <InfoRow label="Ocupación" value={(application.motherData as any).occupation} />
                  <InfoRow label="Lugar de Trabajo" value={(application.motherData as any).workPlace} />
                  <InfoRow label="Dirección Trabajo" value={(application.motherData as any).workAddress} />
                  <InfoRow label="Teléfono Trabajo" value={(application.motherData as any).workPhone} />
                  <InfoRow label="Vive con el Estudiante" value={(application.motherData as any).livesWithStudent ? 'Sí' : 'No'} />
                </CardContent>
              </Card>
            )}

            {/* Representante Legal */}
            <Card>
              <CardHeader><CardTitle className="text-base">Representante Legal</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <InfoRow label="Nombres" value={(application.representativeData as any)?.names} />
                <InfoRow label="Cédula" value={(application.representativeData as any)?.cedula} />
                <InfoRow label="Parentesco" value={(application.representativeData as any)?.relationship} />
                <InfoRow label="Teléfono" value={(application.representativeData as any)?.phone} />
                <InfoRow label="Email" value={(application.representativeData as any)?.email} />
                <InfoRow label="Ocupación" value={(application.representativeData as any)?.occupation} />
                <InfoRow label="Lugar de Trabajo" value={(application.representativeData as any)?.workPlace} />
                <InfoRow label="Dirección Trabajo" value={(application.representativeData as any)?.workAddress} />
                <InfoRow label="Teléfono Trabajo" value={(application.representativeData as any)?.workPhone} />
              </CardContent>
            </Card>

            {/* Contactos de Emergencia */}
            {application.extraContacts && application.extraContacts.length > 0 && (
              <Card className="lg:col-span-2">
                <CardHeader><CardTitle className="text-base">Contactos de Emergencia Adicionales</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {application.extraContacts.map((c: any, i: number) => (
                      <div key={i} className="p-3 bg-slate-50 rounded border">
                        <p className="font-bold text-sm">{c.firstName} {c.lastName}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <span className="font-medium">Parentesco:</span> {c.relationship}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium">Teléfono:</span> {c.phone}
                        </p>
                        {c.email && (
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium">Email:</span> {c.email}
                          </p>
                        )}
                        {c.cedula && (
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium">Cédula:</span> {c.cedula}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Ideario y Aceptación */}
            {application.acceptedIdeario && (
              <Card className="lg:col-span-2 bg-green-50 border-green-200">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">Ideario Institucional Aceptado</p>
                      {application.acceptedAt && (
                        <p className="text-xs text-green-700">
                          Fecha: {format(new Date(application.acceptedAt), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notas de Corrección/Rechazo */}
            {application.correctionRequest && (
              <Card className="lg:col-span-2 bg-amber-50 border-amber-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    Correcciones Solicitadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-line">{application.correctionRequest}</p>
                </CardContent>
              </Card>
            )}

            {application.rejectionReason && (
              <Card className="lg:col-span-2 bg-red-50 border-red-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    Motivo de Rechazo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-line">{application.rejectionReason}</p>
                </CardContent>
              </Card>
            )}

            {application.adminNotes && (
              <Card className="lg:col-span-2 bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    Notas del Administrador
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-line">{application.adminNotes}</p>
                </CardContent>
              </Card>
            )}

            {/* Comentarios Internos */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Comentarios Internos</CardTitle>
                <CardDescription>Notas y observaciones del equipo administrativo (no visibles para el apoderado)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {application.internalComments && application.internalComments.length > 0 && (
                  <>
                    <div className="space-y-3">
                      {application.internalComments.map((comment: any, i: number) => (
                        <div key={i} className="p-3 bg-slate-50 rounded border-l-4 border-primary">
                          <div className="flex justify-between items-start mb-1">
                            <p className="text-xs font-semibold text-primary">{comment.userName}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {format(new Date(comment.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
                            </p>
                          </div>
                          <p className="text-sm whitespace-pre-line">{comment.comment}</p>
                        </div>
                      ))}
                    </div>
                    <Separator />
                  </>
                )}

                {/* Agregar nuevo comentario */}
                <div className="space-y-2">
                  <Label htmlFor="newComment">
                    {application.internalComments && application.internalComments.length > 0 
                      ? 'Agregar Otro Comentario' 
                      : 'Agregar Primer Comentario'}
                  </Label>
                  <Textarea
                    id="newComment"
                    placeholder="Escriba observaciones o notas internas para el equipo administrativo..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <Button size="sm" onClick={handleAddComment} disabled={actionLoading || !newComment.trim()}>
                    <Send className="h-3.5 w-3.5 mr-1" /> 
                    {actionLoading ? 'Guardando...' : 'Agregar Comentario'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Asignación a Directivo */}
            {(['UNDER_REVIEW', 'APPROVED'].includes(application.status) || application.assignedToId) && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Asignación a Directivo para Evaluación
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {application.assignedTo && (
                    <div className="p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="text-sm">
                        <span className="font-medium">Asignado a:</span> {application.assignedTo.firstName} {application.assignedTo.lastName}
                      </p>
                      {application.assignedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Fecha: {format(new Date(application.assignedAt), "dd/MM/yyyy HH:mm", { locale: es })}
                        </p>
                      )}
                    </div>
                  )}
                  
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label htmlFor="directivo-select">Asignar/Reasignar Directivo</Label>
                      <Select value={directivoId} onValueChange={setDirectivoId}>
                        <SelectTrigger id="directivo-select">
                          <SelectValue placeholder="Seleccione un directivo" />
                        </SelectTrigger>
                        <SelectContent>
                          {directivos.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.firstName} {d.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAssign} disabled={actionLoading || !directivoId}>
                      <UserPlus className="h-4 w-4 mr-1" /> Asignar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Documentos Adjuntos</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {application.documents?.map((doc) => (
                  <div key={doc.id} className="border p-4 rounded-lg flex flex-col gap-3 bg-slate-50 hover:border-primary transition-colors hover:shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-semibold truncate" title={DOCUMENT_LABELS[doc.documentType] || doc.documentType}>
                          {DOCUMENT_LABELS[doc.documentType] || doc.documentType}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">{doc.fileName}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-auto">
                      <Button size="sm" variant="outline" className="flex-1 h-8" asChild>
                        <a href={getFileUrl(doc.fileUrl)} target="_blank" rel="noreferrer">
                          <Eye className="h-3.5 w-3.5 mr-1" /> Ver archivo
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
                {(!application.documents || application.documents.length === 0) && (
                  <div className="text-center py-10 text-muted-foreground italic col-span-full">No hay documentos subidos.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cursillo" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gestión de Cursillo</CardTitle>
              <CardDescription>Registro de asistencias y calificaciones por materia.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {enrollments.length === 0 ? (
                <p className="text-center py-10 text-muted-foreground">No está inscrito en materias.</p>
              ) : (
                <div className="space-y-3">
                  {enrollments.map((enr: any) => {
                    const edit = enrollEdits[enr.id] || { attendedSessions: 0, score: '' };
                    const attendancePercent = enr.session?.totalSessions > 0 
                      ? Math.round((edit.attendedSessions / enr.session.totalSessions) * 100) 
                      : 0;
                    const scoreNum = edit.score !== '' ? parseFloat(edit.score) : null;
                    const willPass = attendancePercent >= 80 && scoreNum !== null && scoreNum >= 7;

                    return (
                      <Card key={enr.id} className="overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-all">
                        <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 border-b gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-bold text-lg text-primary">{enr.session?.subject}</p>
                              <Badge variant={enr.passed === true ? 'default' : enr.passed === false ? 'destructive' : 'secondary'} className={enr.passed === true ? 'bg-green-600 hover:bg-green-700' : ''}>
                                {enr.passed === true ? 'Aprobado' : enr.passed === false ? 'Reprobado' : 'Pendiente'}
                              </Badge>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5" />
                                {enr.session?.teacherName || 'Sin docente'}
                              </span>
                              {enr.session?.sessionSchedule && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  {enr.session.sessionSchedule}
                                </span>
                              )}
                              {enr.session?.teamsLink && (
                                <a 
                                  href={enr.session.teamsLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-medium -ml-1 sm:ml-0"
                                >
                                  <LinkIcon className="h-3.5 w-3.5" /> Teams
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-white">
                          <div className="flex flex-col sm:flex-row items-end gap-6">
                            <div className="flex-1 space-y-1.5">
                              <Label htmlFor={`attendance-${enr.id}`} className="text-xs uppercase text-muted-foreground font-semibold flex items-center justify-between">
                                Asistencia <span className={attendancePercent >= 80 ? 'text-green-600' : 'text-slate-400'}>{attendancePercent}%</span>
                              </Label>
                              <div className="flex items-center gap-2">
                                <Input
                                  id={`attendance-${enr.id}`}
                                  type="number"
                                  min="0"
                                  max={enr.session?.totalSessions || 4}
                                  value={edit.attendedSessions}
                                  onChange={(e) => setEnrollEdits(prev => ({
                                    ...prev,
                                    [enr.id]: { ...prev[enr.id], attendedSessions: parseInt(e.target.value) || 0 }
                                  }))}
                                  className="w-20 text-center font-medium"
                                />
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                  / {enr.session?.totalSessions || 4} sesiones
                                </span>
                              </div>
                            </div>

                            <div className="flex-1 space-y-1.5">
                              <Label htmlFor={`score-${enr.id}`} className="text-xs uppercase text-muted-foreground font-semibold">
                                Nota Final
                              </Label>
                              <div className="flex items-center gap-2">
                                <Input
                                  id={`score-${enr.id}`}
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="10"
                                  value={edit.score}
                                  onChange={(e) => setEnrollEdits(prev => ({
                                    ...prev,
                                    [enr.id]: { ...prev[enr.id], score: e.target.value }
                                  }))}
                                  className={`w-24 text-center font-medium ${scoreNum !== null ? (willPass ? 'border-green-300 bg-green-50 text-green-700' : 'border-red-300 bg-red-50 text-red-700') : ''}`}
                                  placeholder="0.0"
                                />
                                <span className="text-sm text-muted-foreground whitespace-nowrap">/ 10.0</span>
                                {willPass && <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />}
                                {!willPass && scoreNum !== null && <XCircle className="h-5 w-5 text-red-600 shrink-0" />}
                              </div>
                            </div>

                            <Button 
                              size="default" 
                              variant={savingId === enr.id ? "outline" : "default"}
                              className="w-full sm:w-[140px] mt-2 sm:mt-0" 
                              onClick={() => handleSaveEnrollment(enr.id)}
                              disabled={savingId === enr.id}
                            >
                              {savingId === enr.id ? (
                                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                              ) : (
                                "Guardar"
                              )}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                  
                  {allEvaluated && !isCursilloFinal && (
                    <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700" onClick={handleFinalize} disabled={finalizing}>
                      {finalizing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} 
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Finalizar Cursillo y Calcular Resultado
                    </Button>
                  )}

                  {isCursilloFinal && (
                    <Card className={`p-4 ${application.status === 'CURSILLO_APPROVED' ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                      <p className="font-bold">
                        {application.status === 'CURSILLO_APPROVED' ? '✅ Cursillo APROBADO' : '❌ Cursillo NO APROBADO'}
                      </p>
                      {application.cursilloNotes && (
                        <p className="text-sm mt-2 text-muted-foreground">{application.cursilloNotes}</p>
                      )}
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pago" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Validación de Pago de Matrícula</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {application.status === 'PAYMENT_UPLOADED' ? (
                <>
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-amber-800 font-medium mb-3 flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Pago pendiente de validación
                    </p>
                    {application.paymentDate && (
                      <InfoRow label="Fecha de Pago" value={format(new Date(application.paymentDate), 'dd/MM/yyyy', { locale: es })} />
                    )}
                    {application.paymentReference && (
                      <InfoRow label="Referencia/Comprobante" value={application.paymentReference} />
                    )}
                    {application.paymentAmount && (
                      <InfoRow label="Monto" value={`$${application.paymentAmount.toFixed(2)}`} />
                    )}
                    
                    {/* Comprobante adjunto */}
                    {(() => {
                      const paymentDoc = application.documents?.find(d => d.documentType === 'PAYMENT_RECEIPT');
                      if (!paymentDoc) return null;
                      return (
                        <div className="mt-3">
                          <Label className="text-sm">Comprobante Adjunto</Label>
                          <Button size="sm" variant="outline" className="mt-2" asChild>
                            <a href={getFileUrl(paymentDoc.fileUrl)} target="_blank" rel="noreferrer">
                              <Eye className="h-3.5 w-3.5 mr-1" /> Ver Comprobante
                            </a>
                          </Button>
                        </div>
                      );
                    })()}
                  </div>

                  <Separator />

                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="flex-1 bg-green-600 hover:bg-green-700">
                          <CheckCircle className="h-4 w-4 mr-1" /> Validar Pago
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Validar Pago de Matrícula</DialogTitle>
                          <DialogDescription>
                            ¿Confirma que el pago es válido y ha sido verificado correctamente?
                          </DialogDescription>
                        </DialogHeader>
                        {application.paymentDate && (
                          <div className="text-sm space-y-1">
                            <p><strong>Fecha:</strong> {format(new Date(application.paymentDate), 'dd/MM/yyyy', { locale: es })}</p>
                            <p><strong>Referencia:</strong> {application.paymentReference}</p>
                            {application.paymentAmount && <p><strong>Monto:</strong> ${application.paymentAmount.toFixed(2)}</p>}
                          </div>
                        )}
                        <DialogFooter>
                          <Button variant="outline">Cancelar</Button>
                          <Button className="bg-green-600 hover:bg-green-700" onClick={handleValidatePaymentApprove} disabled={actionLoading}>
                            {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Validar
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="flex-1" variant="destructive">
                          <XCircle className="h-4 w-4 mr-1" /> Rechazar
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Rechazar Pago</DialogTitle>
                          <DialogDescription>
                            Indique el motivo por el cual el pago no es válido. El apoderado deberá corregirlo y volver a subir el comprobante.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2">
                          <Label htmlFor="payment-rejection">Motivo del Rechazo *</Label>
                          <Textarea
                            id="payment-rejection"
                            placeholder="Ej: Comprobante ilegible, monto incorrecto, fecha incorrecta..."
                            value={paymentRejectionReason}
                            onChange={(e) => setPaymentRejectionReason(e.target.value)}
                            rows={3}
                            required
                          />
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setPaymentRejectionReason('')}>Cancelar</Button>
                          <Button variant="destructive" onClick={handleValidatePaymentReject} disabled={actionLoading || !paymentRejectionReason.trim()}>
                            {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Rechazar Pago
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </>
              ) : application.status === 'PAYMENT_VALIDATED' ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium mb-3 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Pago Validado Correctamente
                  </p>
                  {application.paymentDate && (
                    <InfoRow label="Fecha de Pago" value={format(new Date(application.paymentDate), 'dd/MM/yyyy', { locale: es })} />
                  )}
                  {application.paymentReference && (
                    <InfoRow label="Referencia" value={application.paymentReference} />
                  )}
                  {application.paymentAmount && (
                    <InfoRow label="Monto" value={`$${application.paymentAmount.toFixed(2)}`} />
                  )}
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <p>Estado actual: <strong>{STATUS_LABELS[application.status]}</strong></p>
                  <p className="text-sm mt-2">El pago aún no ha sido cargado por el apoderado.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gestion" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Acciones Admin</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {isSuperAdmin() && (
                <Button variant="destructive" className="w-full" onClick={handleAdminRemove} disabled={actionLoading}>
                  <Trash2 className="h-4 w-4 mr-2" /> Eliminar Solicitud (Superadmin)
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Paralelo</DialogTitle>
            <DialogDescription>
              Seleccione el paralelo disponible para matricular al estudiante. Esta acción consumirá un cupo en el sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Label>Paralelo</Label>
            {loadingParallels ? (
              <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : (
              <Select value={selectedParallel} onValueChange={setSelectedParallel}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un paralelo" />
                </SelectTrigger>
                <SelectContent>
                  {parallels.map((p) => (
                    <SelectItem key={p.parallel} value={p.parallel} disabled={p.available <= 0}>
                      Paralelo "{p.parallel}" — {p.available} cupos disponibles (de {p.totalQuota})
                    </SelectItem>
                  ))}
                  {parallels.length === 0 && (
                    <SelectItem value="none" disabled>No hay paralelos disponibles o configurados</SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleConfirmAssign} disabled={actionLoading || !selectedParallel || selectedParallel === 'none'}>
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Asignar y Matricular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
