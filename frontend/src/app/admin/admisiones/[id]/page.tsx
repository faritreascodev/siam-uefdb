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
  FileCheck, BookOpen, LinkIcon, Trash2,
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
              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={handleApprove}>Aprobar</Button>
              <Button size="sm" variant="destructive" onClick={handleReject}>Rechazar</Button>
              <Button size="sm" variant="outline" onClick={handleCorrections}>Pedir Corrección</Button>
            </>
          )}
          {application.status === 'APPROVED' && needsCursillo && (
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={handleEnrollCursillo}>Inscribir en Cursillo</Button>
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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Datos Estudiante</CardTitle>
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
                <InfoRow label="Nombres" value={`${application.studentFirstName} ${application.studentLastName}`} />
                <InfoRow label="Cédula" value={application.studentCedula} />
                <InfoRow label="Email" value={application.studentEmail} />
                <InfoRow label="Jornada" value={application.shift} />
                <InfoRow label="Promedio" value={averageDisplay} />
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Representante</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <InfoRow label="Nombre" value={(application.representativeData as any)?.names} />
                  <InfoRow label="Teléfono" value={(application.representativeData as any)?.phone} />
                </CardContent>
              </Card>

              {application.extraContacts && application.extraContacts.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Contactos de Emergencia</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {application.extraContacts.map((c: any, i: number) => (
                      <div key={i} className="text-sm p-2 bg-slate-50 rounded border">
                        <p className="font-bold">{c.firstName} {c.lastName}</p>
                        <p className="text-muted-foreground">{c.relationship} · {c.phone}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
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
                  {enrollments.map((enr: any) => (
                    <div key={enr.id} className="border p-3 rounded-md flex justify-between items-center bg-slate-50">
                      <div>
                        <p className="font-bold">{enr.session?.subject}</p>
                        <p className="text-xs text-muted-foreground">{enr.session?.teacherName || 'Sin docente'}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Asistencia</p>
                          <p className="text-sm font-medium">{enr.attendedSessions || 0} / {enr.session?.totalSessions || 4}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Nota</p>
                          <p className={`text-sm font-bold ${enr.score >= 7 ? 'text-green-600' : 'text-red-600'}`}>{enr.score !== null ? enr.score : '—'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {allEvaluated && !isCursilloFinal && (
                    <Button className="w-full mt-4" onClick={handleFinalize} disabled={finalizing}>
                      {finalizing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Finalizar Cursillo
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pago" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Validación de Pago</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {application.status === 'PAYMENT_UPLOADED' ? (
                <div className="space-y-4">
                  <p className="text-amber-600 font-medium">Pago pendiente de validación</p>
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-green-600" onClick={handleValidatePaymentApprove}>Validar Pago</Button>
                    <Button className="flex-1" variant="destructive" onClick={handleValidatePaymentReject}>Rechazar</Button>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-10">Estado del pago: {application.status}</p>
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
    </div>
  );
}
