'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getUsers } from "@/lib/api-users";
import { User as UserType } from "@/types/user";
import { 
  getApplicationDetail, 
  putUnderReview, 
  requestCorrections, 
  approveApplication, 
  rejectApplication,
  assignToDirectivo,
  addInternalComment,
  downloadApplicationPdf,
  getAvailableParallels,
  assignParallel
} from '@/lib/api-admin-applications';
import { Application, STATUS_LABELS, STATUS_COLORS, DOCUMENT_LABELS, GRADE_LEVELS } from '@/types/application';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  User,
  GraduationCap,
  Users,
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Clock,
  MessageSquare,
  UserPlus,
  Send,
  Printer,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ApplicationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ApplicationDetailPage({ params }: ApplicationDetailPageProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [correctionText, setCorrectionText] = useState('');
  const [rejectionText, setRejectionText] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [newComment, setNewComment] = useState('');
  const [directivoId, setDirectivoId] = useState('');
  const [directivos, setDirectivos] = useState<UserType[]>([]);
  const [loadingDirectivos, setLoadingDirectivos] = useState(false);
  const [id, setId] = useState<string | null>(null);

  // Assignment State
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [parallels, setParallels] = useState<{ parallel: string, available: number, totalQuota: number, used: number }[]>([]);
  const [selectedParallel, setSelectedParallel] = useState('');
  const [loadingParallels, setLoadingParallels] = useState(false);

  // @ts-ignore
  const token = session?.accessToken || session?.user?.accessToken;

  useEffect(() => {
    params.then(p => setId(p.id));
  }, [params]);

  useEffect(() => {
    async function loadData() {
      if (!token || !id) return;

      try {
        const data = await getApplicationDetail(token, id);
        setApplication(data);
      } catch (error: any) {
        toast.error(error.message || 'Error al cargar solicitud');
        router.push('/admin/admisiones');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [token, id, router]);

  useEffect(() => {
    const fetchDirectivos = async () => {
      if (!token) return;
      try {
        setLoadingDirectivos(true);
        // Fetch 'principal' (directivo) role users
        const users = await getUsers(token, 'principal');
        setDirectivos(users);
      } catch (error) {
        console.error("Failed to fetch directivos", error);
      } finally {
        setLoadingDirectivos(false);
      }
    };

    fetchDirectivos();
  }, [token]);

  const handleDownloadPdf = async () => {
    if (!token || !application) return;
    try {
      setPdfLoading(true);
      const blob = await downloadApplicationPdf(token, application.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `solicitud-${application.studentCedula || 'document'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Error al generar el PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const handlePutUnderReview = async () => {
    if (!token || !application) return;
    setActionLoading(true);
    try {
      const updated = await putUnderReview(token, application.id);
      setApplication(updated);
      toast.success('Solicitud marcada como "En Revisión"');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestCorrections = async () => {
    if (!token || !application || !correctionText.trim()) return;
    setActionLoading(true);
    try {
      const updated = await requestCorrections(token, application.id, correctionText);
      setApplication(updated);
      toast.success('Correcciones solicitadas');
      setCorrectionText('');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!token || !application) return;
    setActionLoading(true);
    try {
      const updated = await approveApplication(token, application.id, approvalNotes);
      setApplication(updated);
      toast.success('¡Solicitud aprobada!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!token || !application || !rejectionText.trim()) return;
    setActionLoading(true);
    try {
      const updated = await rejectApplication(token, application.id, rejectionText);
      setApplication(updated);
      toast.success('Solicitud rechazada');
      setRejectionText('');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!token || !application || !newComment.trim()) return;
    setActionLoading(true);
    try {
      const updated = await addInternalComment(token, application.id, newComment);
      setApplication(updated);
      toast.success('Comentario agregado');
      setNewComment('');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!token || !application || !directivoId.trim()) return;
    setActionLoading(true);
    try {
      const updated = await assignToDirectivo(token, application.id, directivoId);
      setApplication(updated);
      toast.success('Solicitud asignada');
      setDirectivoId('');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenAssign = async () => {
    if (!token || !application) return;
    setLoadingParallels(true);
    try {
      const data = await getAvailableParallels(token, application.id);
      setParallels(data);
      setAssignDialogOpen(true);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoadingParallels(false);
    }
  };

  const handleConfirmAssign = async () => {
    if (!token || !application || !selectedParallel) return;
    setActionLoading(true);
    try {
      const updated = await assignParallel(token, application.id, selectedParallel);
      setApplication(updated);
      toast.success(`Estudiante matriculado en paralelo ${selectedParallel}`);
      setAssignDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !application) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const gradeLabel = GRADE_LEVELS.find(g => g.value === application.gradeLevel)?.label || application.gradeLevel;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/admisiones">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={pdfLoading}>
            {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4 mr-2" />}
            {!pdfLoading && "PDF"}
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {application.studentFirstName} {application.studentLastName}
            </h1>
            <p className="text-muted-foreground">
              Solicitud para {gradeLabel}
            </p>
          </div>
        </div>
        <Badge className={`${STATUS_COLORS[application.status]} text-sm px-3 py-1`}>
          {STATUS_LABELS[application.status]}
        </Badge>
      </div>

      {/* Corrección requerida banner */}
      {application.status === 'REQUIRES_CORRECTION' && application.correctionRequest && (
        <Card className="border-orange-300 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-medium text-orange-800">Correcciones solicitadas:</p>
                <p className="text-orange-700">{application.correctionRequest}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid de información */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Datos del Estudiante */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Datos del Estudiante
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow label="Nombres" value={`${application.studentFirstName} ${application.studentLastName}`} />
            <InfoRow label="Cédula" value={application.studentCedula} />
            <InfoRow label="Género" value={application.studentGender === 'M' ? 'Masculino' : 'Femenino'} />
            <InfoRow 
              label="Fecha de Nacimiento" 
              value={application.studentBirthDate ? format(new Date(application.studentBirthDate), 'dd/MM/yyyy', { locale: es }) : '-'} 
            />
            <InfoRow label="Dirección" value={application.studentAddress} />
            <InfoRow label="Teléfono" value={application.studentPhone} />
            <InfoRow label="Email" value={application.studentEmail} />
            <Separator />
            <InfoRow label="Tipo de Sangre" value={application.bloodType} />
            <InfoRow label="Discapacidad" value={application.hasDisability ? `Sí - ${application.disabilityDetail}` : 'No'} />
            <InfoRow label="Atención Especial" value={application.needsSpecialCare ? `Sí - ${application.specialCareDetail}` : 'No'} />
          </CardContent>
        </Card>

        {/* Datos Académicos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Datos Académicos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow label="Grado Solicitado" value={gradeLabel} />
            <InfoRow label="Jornada" value={application.shift === 'MATUTINA' ? 'Matutina' : 'Vespertina'} />
            <InfoRow label="Escuela Anterior" value={application.previousSchool} />
            <InfoRow label="Promedio Último Año" value={application.lastYearAverage?.toString()} />
            <InfoRow label="Ha Repetido Año" value={application.hasRepeatedYear ? `Sí - ${application.repeatedYearDetail}` : 'No'} />
          </CardContent>
        </Card>

        {/* Datos Familiares */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Datos del Representante
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow label="Nombres" value={(application.representativeData as any)?.names} />
            <InfoRow label="Parentesco" value={(application.representativeData as any)?.relationship} />
            <InfoRow label="Cédula" value={(application.representativeData as any)?.cedula} />
            <InfoRow label="Teléfono" value={(application.representativeData as any)?.phone} />
            <InfoRow label="Email" value={(application.representativeData as any)?.email} />
            <InfoRow label="Ocupación" value={(application.representativeData as any)?.occupation} />
          </CardContent>
        </Card>

        {/* Documentos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {application.documents && application.documents.length > 0 ? (
              <div className="space-y-3">
                {application.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{DOCUMENT_LABELS[doc.documentType]}</p>
                      <p className="text-sm text-muted-foreground">{doc.fileName}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL}${doc.fileUrl}`, '_blank')}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Ver
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No hay documentos</p>
            )}
          </CardContent>
        </Card>
      </div>



      {/* Acciones de Revisión y Matriculación */}
      {['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'PAYMENT_VALIDATED'].includes(application.status) && (
        (() => {
          // @ts-ignore
          const userRoles = session?.user?.roles || [];
          const canProcessApplications = userRoles.some((r: string) => 
            ['secretary', 'principal', 'directivo', 'superadmin'].includes(r)
          );
          
          if (!canProcessApplications) return null;

          return (
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Solicitud</CardTitle>
                <CardDescription>Acciones disponibles para esta solicitud</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                {application.status === 'SUBMITTED' && (
                  <Button onClick={handlePutUnderReview} disabled={actionLoading} variant="outline">
                    <Clock className="mr-2 h-4 w-4" />
                    Marcar En Revisión
                  </Button>
                )}

                {/* Botones de Aprobación/Rechazo (Solo visible si NO está aprobada/rechazada aún) */}
                {['SUBMITTED', 'UNDER_REVIEW'].includes(application.status) && (
                  <>
                    {/* Aprobar */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="bg-green-600 hover:bg-green-700">
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Aprobar
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Aprobar Solicitud</DialogTitle>
                          <DialogDescription>
                            ¿Confirma que desea aprobar esta solicitud de admisión?
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <Label>Notas (opcional)</Label>
                          <Textarea
                            placeholder="Notas internas..."
                            value={approvalNotes}
                            onChange={(e) => setApprovalNotes(e.target.value)}
                          />
                        </div>
                        <DialogFooter>
                          <Button variant="outline">Cancelar</Button>
                          <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={handleApprove}
                            disabled={actionLoading}
                          >
                            {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Aprobar
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    {/* Solicitar Correcciones */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-50">
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          Correcciones
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Solicitar Correcciones</DialogTitle>
                          <DialogDescription>
                            Indique qué debe corregir el solicitante
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <Label>Correcciones requeridas *</Label>
                          <Textarea
                            placeholder="Describa las correcciones necesarias..."
                            value={correctionText}
                            onChange={(e) => setCorrectionText(e.target.value)}
                            rows={4}
                          />
                        </div>
                        <DialogFooter>
                          <Button variant="outline">Cancelar</Button>
                          <Button
                            onClick={handleRequestCorrections}
                            disabled={!correctionText.trim() || actionLoading}
                          >
                            Enviar
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    {/* Rechazar */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="destructive">
                          <XCircle className="mr-2 h-4 w-4" />
                          Rechazar
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Rechazar Solicitud</DialogTitle>
                          <DialogDescription>
                            Esta acción es irreversible. Indique el motivo del rechazo.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <Label>Motivo del rechazo *</Label>
                          <Textarea
                            placeholder="Indique el motivo..."
                            value={rejectionText}
                            onChange={(e) => setRejectionText(e.target.value)}
                            rows={4}
                          />
                        </div>
                        <DialogFooter>
                          <Button variant="outline">Cancelar</Button>
                          <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={!rejectionText.trim() || actionLoading}
                          >
                            Rechazar
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </>
                )}

                {/* MATRICULACIÓN / ASIGNACIÓN DE PARALELO */}
                {['APPROVED', 'PAYMENT_VALIDATED'].includes(application.status) && (
                  <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={handleOpenAssign}
                        disabled={loadingParallels}
                      >
                         {loadingParallels ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GraduationCap className="mr-2 h-4 w-4" />}
                        Asignar Paralelo y Matricular
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Asignación de Paralelo</DialogTitle>
                        <DialogDescription>
                          Seleccione el paralelo para matricular al estudiante.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="py-4 space-y-4">
                        {loadingParallels ? (
                          <div className="flex justify-center p-4">
                            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-3">
                            {parallels.map((p) => (
                              <div 
                                key={p.parallel}
                                className={`
                                  border rounded-lg p-3 cursor-pointer transition-all
                                  ${selectedParallel === p.parallel ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-600' : 'border-gray-200 hover:border-purple-300'}
                                  ${p.available === 0 ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''}
                                `}
                                onClick={() => p.available > 0 && setSelectedParallel(p.parallel)}
                              >
                                <div className="flex justify-between items-center mb-2">
                                  <span className="font-bold text-lg">Paralelo {p.parallel}</span>
                                  <Badge variant={p.available > 0 ? (p.available < 5 ? 'secondary' : 'outline') : 'destructive'}>
                                    {p.available > 0 ? `${p.available} cupos` : 'Lleno'}
                                  </Badge>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${p.available === 0 ? 'bg-gray-400' : 'bg-purple-600'}`}
                                    style={{ width: `${Math.min(100, (p.used / p.totalQuota) * 100)}%` }}
                                  ></div>
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                  <span>Usados: {p.used}</span>
                                  <span>Total: {p.totalQuota}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <DialogFooter>
                        <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancelar</Button>
                        <Button
                          className="bg-purple-600 hover:bg-purple-700"
                          onClick={handleConfirmAssign}
                          disabled={!selectedParallel || actionLoading}
                        >
                          {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Confirmar Matriculación
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}

              </CardContent>
            </Card>
          );
        })()
      )}

      {/* Comentarios Internos y Asignación */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Comentarios Internos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Comentarios Internos
            </CardTitle>
            <CardDescription>Solo visibles para el personal administrativo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Lista de comentarios */}
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {application.internalComments && application.internalComments.length > 0 ? (
                application.internalComments.map((comment, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-sm">{comment.userName || 'Usuario'}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comment.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{comment.comment}</p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">No hay comentarios</p>
              )}
            </div>
            
            {/* Agregar comentario */}
            <div className="flex gap-2">
              <Textarea
                placeholder="Agregar comentario..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={2}
                className="flex-1"
              />
              <Button 
                onClick={handleAddComment}
                disabled={!newComment.trim() || actionLoading}
                size="icon"
                className="h-auto"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Asignación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Asignación
            </CardTitle>
            <CardDescription>Asignar solicitud a un directivo para revisión</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {application.assignedTo ? (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Asignado a:</p>
                <p className="font-medium text-blue-700">
                  {application.assignedTo.firstName || ''} {application.assignedTo.lastName || ''}
                </p>
                {application.assignedAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(application.assignedAt), "d 'de' MMMM, yyyy", { locale: es })}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No asignada</p>
            )}
            
            <Separator />
            
            <div className="space-y-2">
              <Label>Directivo</Label>
              <div className="flex gap-2">
                <Select
                  value={directivoId}
                  onValueChange={setDirectivoId}
                  disabled={actionLoading || loadingDirectivos}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={loadingDirectivos ? "Cargando..." : "Seleccionar directivo"} />
                  </SelectTrigger>
                  <SelectContent>
                    {directivos.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </SelectItem>
                    ))}
                    {directivos.length === 0 && !loadingDirectivos && (
                       <SelectItem value="none" disabled>No se encontraron directivos</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                
                <Button
                  onClick={handleAssign}
                  disabled={!directivoId || actionLoading}
                >
                  Asignar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Seleccione el directivo para asignar esta solicitud
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value || '-'}</span>
    </div>
  );
}
