'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
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
  FileCheck, BookOpen, LinkIcon, Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRoles } from '@/hooks/use-roles';

function requiresCursillo(gradeLevel?: string | null, previousSchool?: string | null): boolean {
  if (!gradeLevel) return false;
  // Soporta formato nuevo y legado
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
  const { data: session } = useSession();
  const { isSuperAdmin } = useRoles();
  const router = useRouter();
  // @ts-expect-error - accessToken is added in next-auth callbacks
  const token = session?.accessToken || (session?.user as { accessToken?: string })?.accessToken;

  const [id, setId] = useState<string | null>(null);
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

  // Cursillo
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [enrollEdits, setEnrollEdits] = useState<Record<string, { attendedSessions: number; score: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);

  useEffect(() => { params.then(p => setId(p.id)); }, [params]);

  const loadApp = useCallback(async () => {
    if (!token || !id) return;
    try {
      const [data, dirs] = await Promise.all([
        getApplicationDetail(token, id),
        getUsers(token, 'principal').catch(() => [])
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

  // ── Action handlers ──────────────────────────────────────────────────
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
  const handleApprove = wrap(async () => { const r = await approveApplication(token, application!.id, approvalNotes); toast.success('✅ Solicitud aprobada'); return r; });
  const handleReject = wrap(async () => {
    if (!rejectionText.trim()) { toast.error('Ingrese el motivo de rechazo'); return; }
    const r = await rejectApplication(token, application!.id, rejectionText); toast.success('Solicitud rechazada'); setRejectionText(''); return r;
  });
  const handleCorrections = wrap(async () => {
    if (!correctionText.trim()) { toast.error('Ingrese las correcciones'); return; }
    const r = await requestCorrections(token, application!.id, correctionText); toast.success('Correcciones solicitadas'); setCorrectionText(''); return r;
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

  // ── Loading state ────────────────────────────────────────────────────
  if (loading || !application) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const gradeLabel = GRADE_LEVELS.find(g => g.value === application.gradeLevel)?.label || application.gradeLevel;
  const needsCursillo = requiresCursillo(application.gradeLevel, application.previousSchool);
  const hasEnrollments = enrollments.length > 0;
  const allEvaluated = enrollments.length > 0 && enrollments.every((e: any) => e.score !== null);
  const isCursilloFinal = ['CURSILLO_APPROVED', 'CURSILLO_REJECTED'].includes(application.status);

  const averageDisplay = application.lastYearAverage
    ? Number(application.lastYearAverage).toFixed(2)
    : '—';

  // ── JSX ──────────────────────────────────────────────────────────────
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

      {/* Banner corrección */}
      {application.status === 'REQUIRES_CORRECTION' && application.correctionRequest && (
        <Card className="border-orange-300 bg-orange-50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <p className="font-medium text-orange-800">Correcciones solicitadas:</p>
              <p className="text-orange-700">{application.correctionRequest}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Banner cursillo */}
      {needsCursillo && !['CURSILLO_APPROVED', 'PAYMENT_UPLOADED', 'PAYMENT_VALIDATED', 'MATRICULATED'].includes(application.status) && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-3 flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-blue-600 shrink-0" />
            <div>
              <p className="font-medium text-blue-800">Este aspirante requiere cursillo de admisión</p>
              <p className="text-xs text-blue-600">Institución externa · Ve al tab «Cursillo» para gestionar</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ACCIONES rápidas */}
      {(() => {
        const s = application.status;
        return (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" /> Acciones Administrativas
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {s === 'SUBMITTED' && (
                <Button size="sm" onClick={handlePutUnderReview} disabled={actionLoading}>
                  {actionLoading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Clock className="h-3.5 w-3.5 mr-1" />}
                  Poner en Revisión
                </Button>
              )}
              {['SUBMITTED', 'UNDER_REVIEW'].includes(s) && (
                <>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="h-3.5 w-3.5 mr-1" /> Aprobar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Aprobar Solicitud</DialogTitle><DialogDescription>La solicitud pasará a estado Aprobada.</DialogDescription></DialogHeader>
                      <Label>Notas de aprobación (opcional)</Label>
                      <Textarea value={approvalNotes} onChange={e => setApprovalNotes(e.target.value)} rows={3} />
                      <DialogFooter>
                        <Button className="bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={actionLoading}>
                          {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Confirmar Aprobación
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Dialog>
                    <DialogTrigger asChild><Button size="sm" variant="destructive"><XCircle className="h-3.5 w-3.5 mr-1" /> Rechazar</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Rechazar Solicitud</DialogTitle></DialogHeader>
                      <Label>Motivo del rechazo</Label>
                      <Textarea value={rejectionText} onChange={e => setRejectionText(e.target.value)} rows={3} />
                      <DialogFooter>
                        <Button variant="destructive" onClick={handleReject} disabled={!rejectionText.trim() || actionLoading}>
                          {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Rechazar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Dialog>
                    <DialogTrigger asChild><Button size="sm" variant="outline"><AlertTriangle className="h-3.5 w-3.5 mr-1" /> Pedir Corrección</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Solicitar Correcciones</DialogTitle></DialogHeader>
                      <Label>¿Qué debe corregir el apoderado?</Label>
                      <Textarea value={correctionText} onChange={e => setCorrectionText(e.target.value)} rows={3} />
                      <DialogFooter>
                        <Button onClick={handleCorrections} disabled={!correctionText.trim() || actionLoading}>
                          {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Solicitar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}
              {/* Inscribir en cursillo si está APPROVED y requiere */}
              {s === 'APPROVED' && needsCursillo && (
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={handleEnrollCursillo} disabled={actionLoading}>
                  <BookOpen className="h-3.5 w-3.5 mr-1" /> Inscribir en Cursillo
                </Button>
              )}
              {/* Asignar paralelo si pago validado O cursillo aprobado */}
              {(s === 'PAYMENT_VALIDATED' || s === 'CURSILLO_APPROVED') && (
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={handleOpenAssign} disabled={loadingParallels}>
                  {loadingParallels ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <GraduationCap className="h-3.5 w-3.5 mr-1" />} Asignar Paralelo
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* TABS */}
      <Tabs defaultValue="info">
        <TabsList className="h-auto flex-wrap gap-1">
          <TabsTrigger value="info"><User className="h-3.5 w-3.5 mr-1" />Información</TabsTrigger>
          <TabsTrigger value="documents"><FileText className="h-3.5 w-3.5 mr-1" />Documentos</TabsTrigger>
          {needsCursillo && (
            <TabsTrigger value="cursillo" onClick={() => { if (enrollments.length === 0) loadEnrollments(); }}>
              <BookOpen className="h-3.5 w-3.5 mr-1" />Cursillo
              {application.status === 'CURSILLO_APPROVED' && <span className="ml-1 text-green-600 text-xs">✓</span>}
              {application.status === 'CURSILLO_REJECTED' && <span className="ml-1 text-red-600 text-xs">✗</span>}
            </TabsTrigger>
          )}
          <TabsTrigger value="pago">
            <CreditCard className="h-3.5 w-3.5 mr-1" />Pago
            {application.status === 'PAYMENT_UPLOADED' && <span className="ml-1 w-2 h-2 rounded-full bg-amber-500 inline-block" />}
            {application.status === 'PAYMENT_VALIDATED' && <span className="ml-1 text-green-600 text-xs">✓</span>}
          </TabsTrigger>
          <TabsTrigger value="gestion"><MessageSquare className="h-3.5 w-3.5 mr-1" />Gestión</TabsTrigger>
        </TabsList>

        {/* ── TAB: INFORMACIÓN ─────────────────────────────────────────── */}
        <TabsContent value="info" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-base"><User className="h-4 w-4" />Datos del Estudiante</CardTitle>
                {(() => {
                  const photoDoc = application.documents?.find(d => d.documentType === 'STUDENT_PHOTO');
                  if (!photoDoc) return null;
                  const url = getFileUrl(photoDoc.fileUrl);
                  return (
                    <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-primary/20 bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="Foto Estudiante" className="h-full w-full object-cover" />
                    </div>
                  );
                })()}
              </CardHeader>
              <CardContent className="space-y-2">
                <InfoRow label="Nombres" value={`${application.studentFirstName} ${application.studentLastName}`} />
                <InfoRow label="Cédula" value={application.studentCedula} />
                <InfoRow label="Tipo Estudiante" value={application.enrollmentType === 'RETURNING_STUDENT' ? 'Estudiante Antiguo (Renovación)' : 'Estudiante Nuevo'} />
                <InfoRow label="Género" value={application.studentGender === 'M' ? 'Masculino' : 'Femenino'} />
                <InfoRow label="Fecha Nacimiento" value={application.studentBirthDate ? format(new Date(application.studentBirthDate), 'dd/MM/yyyy', { locale: es }) : null} />
                <InfoRow label="Nacionalidad" value={application.studentNationality} />
                <InfoRow label="Dirección" value={application.studentAddress} />
                <InfoRow label="Sector" value={application.studentSector} />
                <InfoRow label="Teléfono" value={application.studentPhone} />
                <InfoRow label="Email" value={application.studentEmail} />
                <Separator />
                <InfoRow label="Tipo de Sangre" value={application.bloodType} />
                <InfoRow label="Discapacidad" value={application.hasDisability ? `Sí — ${application.disabilityDetail}` : 'No'} />
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><GraduationCap className="h-4 w-4" />Datos Académicos</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <InfoRow label="Grado Solicitado" value={gradeLabel} />
                  {application.specialty && <InfoRow label="Especialidad" value={application.specialty} />}
                  <InfoRow label="Jornada" value={application.shift} />
                  <InfoRow label="Escuela Anterior" value={application.previousSchool} />
                  <InfoRow label="Promedio Último Año" value={averageDisplay} />
                  <InfoRow label="Ha Repetido Año" value={application.hasRepeatedYear ? `Sí — ${application.repeatedYearDetail}` : 'No'} />
                  {application.status === 'MATRICULATED' && application.assignedParallel && (
                    <div className="flex justify-between items-center bg-purple-50 p-2 rounded-md border border-purple-100 mt-2">
                      <span className="text-purple-900 font-medium text-sm">Paralelo Asignado</span>
                      <span className="font-bold text-purple-700 bg-purple-200 px-2 py-0.5 rounded text-sm">
                        {application.assignedParallel}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4" />Representante</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <InfoRow label="Nombres" value={(application.representativeData as any)?.names} />
                  <InfoRow label="Parentesco" value={(application.representativeData as any)?.relationship} />
                  <InfoRow label="Cédula" value={(application.representativeData as any)?.cedula} />
                  <InfoRow label="Teléfono" value={(application.representativeData as any)?.phone} />
                  <InfoRow label="Email" value={(application.representativeData as any)?.email} />
                  <InfoRow label="Ocupación" value={(application.representativeData as any)?.occupation} />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle className="text-base">Padre</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <InfoRow label="Nombres" value={(application.fatherData as any)?.names} />
                <InfoRow label="Cédula" value={(application.fatherData as any)?.cedula} />
                <InfoRow label="Teléfono" value={(application.fatherData as any)?.phone} />
                <InfoRow label="Vive con estudiante" value={(application.fatherData as any)?.livesWithStudent ? 'Sí' : 'No'} />
                <InfoRow label="Empresa" value={(application.fatherData as any)?.workPlace} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Madre</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <InfoRow label="Nombres" value={(application.motherData as any)?.names} />
                <InfoRow label="Cédula" value={(application.motherData as any)?.cedula} />
                <InfoRow label="Teléfono" value={(application.motherData as any)?.phone} />
                <InfoRow label="Vive con estudiante" value={(application.motherData as any)?.livesWithStudent ? 'Sí' : 'No'} />
                <InfoRow label="Empresa" value={(application.motherData as any)?.workPlace} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── TAB: DOCUMENTOS ──────────────────────────────────────────── */}
        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />Documentos Adjuntos ({application.documents?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {application.documents && application.documents.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {application.documents.map((doc: any) => (
                    <a key={doc.id}
                      href={`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/+$/, '')}/${doc.fileUrl.replace(/^\/+/, '')}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors group">
                      <FileText className="h-8 w-8 text-muted-foreground group-hover:text-primary" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{DOCUMENT_LABELS[doc.documentType as keyof typeof DOCUMENT_LABELS] || doc.documentType}</p>
                        <p className="text-xs text-muted-foreground truncate">{doc.fileName}</p>
                      </div>
                      <Eye className="h-4 w-4 ml-auto text-muted-foreground group-hover:text-primary shrink-0" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-10">No hay documentos adjuntos</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB: CURSILLO ────────────────────────────────────────────── */}
        {needsCursillo && (
          <TabsContent value="cursillo" className="mt-4">
            <Card className={isCursilloFinal ? (application.status === 'CURSILLO_APPROVED' ? 'border-green-200' : 'border-red-200') : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="h-4 w-4" />Cursillo de Admisión
                  {application.status === 'CURSILLO_APPROVED' && <Badge className="bg-green-100 text-green-800 ml-2">Aprobado</Badge>}
                  {application.status === 'CURSILLO_REJECTED' && <Badge className="bg-red-100 text-red-800 ml-2">Reprobado</Badge>}
                </CardTitle>
                <CardDescription>
                  Criterios: ≥80% asistencia AND ≥7/10 nota, en <strong>todas</strong> las materias · 1 Abr – 1 May 2026
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {application.cursilloNotes && (
                  <div className={`p-3 rounded-lg text-sm ${application.status === 'CURSILLO_APPROVED' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {application.cursilloNotes}
                  </div>
                )}

                {!hasEnrollments && !isCursilloFinal && (
                  <div className="text-center py-8 space-y-3">
                    <p className="text-muted-foreground text-sm">El estudiante aún no está inscrito en las materias del cursillo.</p>
                    <Button onClick={handleEnrollCursillo} disabled={actionLoading} className="bg-blue-600 hover:bg-blue-700">
                      {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <BookOpen className="h-4 w-4 mr-2" />}
                      Inscribir en materias del cursillo
                    </Button>
                  </div>
                )}

                {loadingEnrollments && <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}

                {!loadingEnrollments && enrollments.length > 0 && (
                  <div className="space-y-3">
                    {enrollments.map((enr: any) => {
                      const e = enrollEdits[enr.id] || { attendedSessions: 0, score: '' };
                      const total = enr.session?.totalSessions || 4;
                      const pct = Math.round((e.attendedSessions / total) * 100);
                      const scoreNum = parseFloat(e.score);
                      const okAtt = pct >= 80;
                      const okScore = !isNaN(scoreNum) && scoreNum >= 7;

                      return (
                        <div key={enr.id} className={`border rounded-lg p-4 space-y-3 ${enr.passed === true ? 'border-green-200 bg-green-50/40' : enr.passed === false ? 'border-red-200 bg-red-50/40' : ''}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{enr.session?.subject}</p>
                              <p className="text-xs text-muted-foreground">
                                {enr.session?.sessionSchedule || 'Horario por confirmar'} ·{' '}
                                <a href={enr.session?.teamsLink} target="_blank" className="text-blue-600 hover:underline inline-flex items-center gap-0.5">
                                  <LinkIcon className="h-3 w-3" />Teams
                                </a>
                                {enr.session?.teacherName && ` · ${enr.session.teacherName}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {enr.passed === true && <CheckCircle className="h-5 w-5 text-green-600" />}
                              {enr.passed === false && <XCircle className="h-5 w-5 text-red-600" />}
                              {enr.passed === null && <Badge variant="secondary" className="text-xs">{pct}% · {e.score || '—'}/10</Badge>}
                            </div>
                          </div>

                          {!isCursilloFinal && (
                            <div className="grid grid-cols-3 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs">Asistencias (de {total})</Label>
                                <Input type="number" min={0} max={total} value={e.attendedSessions}
                                  onChange={ev => setEnrollEdits(p => ({ ...p, [enr.id]: { ...p[enr.id], attendedSessions: parseInt(ev.target.value) || 0 } }))}
                                  className={`h-8 text-sm ${!okAtt && e.attendedSessions > 0 ? 'border-red-300' : ''}`} />
                                <p className={`text-xs ${okAtt ? 'text-green-600' : 'text-orange-600'}`}>{pct}% {okAtt ? '✓' : '(min 80%)'}</p>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Calificación /10</Label>
                                <Input type="number" min={0} max={10} step={0.5} value={e.score} placeholder="—"
                                  onChange={ev => setEnrollEdits(p => ({ ...p, [enr.id]: { ...p[enr.id], score: ev.target.value } }))}
                                  className={`h-8 text-sm ${e.score !== '' && !okScore ? 'border-red-300' : ''}`} />
                                <p className={`text-xs ${!e.score ? 'text-muted-foreground' : okScore ? 'text-green-600' : 'text-orange-600'}`}>
                                  {!e.score ? '—' : okScore ? '✓ Ok' : '(min 7)'}
                                </p>
                              </div>
                              <div className="space-y-1 flex flex-col justify-end">
                                <Button size="sm" className="h-8 w-full" onClick={() => handleSaveEnrollment(enr.id)} disabled={savingId === enr.id}>
                                  {savingId === enr.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Guardar'}
                                </Button>
                                {e.score !== '' && (
                                  <p className={`text-xs text-center font-medium ${okAtt && okScore ? 'text-green-600' : 'text-red-600'}`}>
                                    {okAtt && okScore ? '✓ Aprueba' : '✗ Reprueba'}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {!isCursilloFinal && (
                      <div className="flex items-center justify-between pt-3 border-t">
                        <p className="text-sm text-muted-foreground">
                          {allEvaluated ? '✓ Todas las materias evaluadas' : `Faltan calificaciones en ${enrollments.filter((e: any) => e.score === null).length} materia(s)`}
                        </p>
                        <Button onClick={handleFinalize} disabled={!allEvaluated || finalizing}>
                          {finalizing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileCheck className="h-4 w-4 mr-2" />}
                          Calcular resultado final
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {application.status === 'CURSILLO_REJECTED' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3 mt-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-red-800">El estudiante reprobó el cursillo</p>
                        <p className="text-sm text-red-600">Eliminar la solicitud libera el cupo para otro aspirante.</p>
                      </div>
                    </div>
                    {isSuperAdmin() && (
                      <Button variant="destructive" className="w-full" onClick={handleAdminRemove} disabled={actionLoading}>
                        {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                        Eliminar solicitud y liberar cupo
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* ── TAB: PAGO ────────────────────────────────────────────────── */}
        <TabsContent value="pago" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><CreditCard className="h-4 w-4" />Comprobante de Pago</CardTitle>
              <CardDescription>
                {application.status === 'PAYMENT_VALIDATED' ? '✅ Pago validado por secretaría'
                  : application.status === 'PAYMENT_UPLOADED' ? '⏳ Pendiente de validación'
                    : 'El apoderado sube el comprobante una vez aprobada la solicitud'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {application.paymentDate && (
                <div className="grid sm:grid-cols-2 gap-3">
                  <InfoRow label="Fecha de pago" value={format(new Date(application.paymentDate), 'dd/MM/yyyy', { locale: es })} />
                  <InfoRow label="Referencia / N° comprobante" value={application.paymentReference} />
                  {(application as any).paymentValidatedAt && (
                    <InfoRow label="Validado el" value={format(new Date((application as any).paymentValidatedAt), 'dd/MM/yyyy HH:mm', { locale: es })} />
                  )}
                </div>
              )}

              {application.documents?.filter((d: any) => d.documentType === 'PAYMENT_RECEIPT').map((doc: any) => (
                <a key={doc.id}
                  href={getFileUrl(doc.fileUrl)}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors group">
                  <FileText className="h-10 w-10 text-muted-foreground group-hover:text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">Comprobante de Pago</p>
                    <p className="text-sm text-muted-foreground truncate">{doc.fileName}</p>
                  </div>
                  <Eye className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                </a>
              ))}

              {!application.paymentDate && (
                <p className="text-center text-muted-foreground py-8">El apoderado aún no ha subido el comprobante</p>
              )}

              {application.status === 'PAYMENT_UPLOADED' && (
                <div className="space-y-3 pt-3 border-t">
                  <p className="font-medium text-sm">Validar comprobante</p>
                  <div className="flex gap-3">
                    <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleValidatePaymentApprove} disabled={actionLoading}>
                      {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                      Validar Pago
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="destructive" className="flex-1"><XCircle className="h-4 w-4 mr-2" />Rechazar</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Rechazar Comprobante</DialogTitle><DialogDescription>Indique el motivo para notificar al apoderado.</DialogDescription></DialogHeader>
                        <Label>Motivo</Label>
                        <Textarea className="mt-2" placeholder="Ej: Comprobante ilegible..." value={paymentRejectionReason} onChange={e => setPaymentRejectionReason(e.target.value)} />
                        <DialogFooter>
                          <Button variant="destructive" onClick={handleValidatePaymentReject} disabled={!paymentRejectionReason.trim() || actionLoading}>
                            Confirmar Rechazo
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              )}

              {application.status === 'PAYMENT_VALIDATED' && (
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Pago validado</p>
                    <p className="text-sm text-green-600">Puede asignarle un paralelo al estudiante.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB: GESTIÓN ─────────────────────────────────────────────── */}
        <TabsContent value="gestion" className="mt-4">
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><MessageSquare className="h-4 w-4" />Comentarios Internos</CardTitle>
                  <CardDescription>Solo visibles para staff administrativo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {application.internalComments && application.internalComments.length > 0 ? (
                      application.internalComments.map((c: any, i: number) => (
                        <div key={i} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex justify-between items-start">
                            <span className="font-medium text-sm">{c.userName || 'Usuario'}</span>
                            <span className="text-xs text-muted-foreground">{format(new Date(c.createdAt), 'dd/MM/yy HH:mm', { locale: es })}</span>
                          </div>
                          <p className="text-sm mt-1">{c.comment}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-4 text-sm">No hay comentarios</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Textarea placeholder="Agregar comentario..." value={newComment} onChange={e => setNewComment(e.target.value)} rows={2} className="flex-1" />
                    <Button onClick={handleAddComment} disabled={!newComment.trim() || actionLoading} size="icon" className="h-auto">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><UserPlus className="h-4 w-4" />Asignar a Directivo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select value={directivoId} onValueChange={setDirectivoId}>
                    <SelectTrigger><SelectValue placeholder="Seleccione un directivo" /></SelectTrigger>
                    <SelectContent>
                      {directivos.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.firstName} {d.lastName}</SelectItem>
                      ))}
                      {directivos.length === 0 && <div className="p-2 text-sm text-center text-muted-foreground">No hay directivos</div>}
                    </SelectContent>
                  </Select>
                  <Button className="w-full" onClick={handleAssign} disabled={!directivoId || actionLoading || application.assignedToId === directivoId}>
                    {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                    {application.assignedToId ? 'Reasignar' : 'Asignar'}
                  </Button>
                  {application.assignedTo && (
                    <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span>Asignado a: <strong>{(application.assignedTo as any).firstName} {(application.assignedTo as any).lastName}</strong></span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Zona peligro */}
            {isSuperAdmin() && ['REJECTED', 'CURSILLO_REJECTED'].includes(application.status) && (
              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base text-destructive"><Trash2 className="h-4 w-4" />Zona de Peligro</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">Elimina permanentemente la solicitud y libera el cupo para otro aspirante.</p>
                  <Button variant="destructive" onClick={handleAdminRemove} disabled={actionLoading}>
                    {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                    Eliminar solicitud y liberar cupo
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog asignar paralelo */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Asignar Paralelo</DialogTitle><DialogDescription>Seleccione el paralelo para matricular al estudiante.</DialogDescription></DialogHeader>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {parallels.map(p => (
              <div key={p.parallel} onClick={() => setSelectedParallel(p.parallel)}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedParallel === p.parallel ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'} ${p.available === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Paralelo {p.parallel}</span>
                  <Badge variant={p.available > 5 ? 'secondary' : p.available > 0 ? 'outline' : 'destructive'}>
                    {p.available} disponibles
                  </Badge>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Usados: {p.used}</span><span>Total: {p.totalQuota}</span>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleConfirmAssign} disabled={!selectedParallel || actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirmar Matriculación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
