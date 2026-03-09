'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApplication, uploadDocument, uploadPaymentDetails } from '@/lib/api-applications';
import { downloadApplicationPdf } from '@/lib/api-admin-applications';
import { Application, STATUS_LABELS, STATUS_COLORS, DOCUMENT_LABELS, GRADE_LEVELS } from '@/types/application';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  User,
  GraduationCap,
  Users,
  FileText,
  AlertCircle,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Briefcase,
  ExternalLink,
  CheckCircle,
  Video,
  CreditCard,
  FileDown,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { use } from 'react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ApplicationDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  // @ts-ignore
  const token = session?.accessToken || session?.user?.accessToken;

  useEffect(() => {
    async function loadApplication() {
      if (!token || !id) return;

      try {
        const app = await getApplication(token, id);
        setApplication(app);
      } catch (error) {
        console.error('Error loading application:', error);
        router.push('/apoderado');
      } finally {
        setLoading(false);
      }
    }

    loadApplication();
  }, [id, token, router]);

  const handleDownloadPdf = async () => {
    if (!token || !application) return;
    setPdfLoading(true);
    try {
      const fullName = `${application.studentLastName || ''}_${application.studentFirstName || ''}`;
      await downloadApplicationPdf(token, application.id, fullName, application.studentCedula || undefined);
      toast.success('PDF descargado correctamente');
    } catch (err: any) {
      toast.error(err.message || 'Error al descargar PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!application) {
    return null;
  }

  const canEdit = ['DRAFT', 'REQUIRES_CORRECTION'].includes(application.status);
  const gradeLabel = GRADE_LEVELS.find(g => g.value === application.gradeLevel)?.label || application.gradeLevel;

  const handlePaymentSubmit = async () => {
    if (!paymentFile || !paymentDate) {
      toast.error('Por favor selecciona un archivo y una fecha de pago');
      return;
    }

    if (paymentFile.size > 5 * 1024 * 1024) {
      toast.error('El archivo excede el límite de 5MB');
      return;
    }

    // @ts-ignore
    const token = session?.accessToken || session?.user?.accessToken;
    if (!token) return;

    setIsSubmittingPayment(true);
    try {
      // 1. Upload receipt document
      await uploadDocument(token, application.id, 'PAYMENT_RECEIPT', paymentFile);

      // 2. Upload payment details and update status
      const updated = await uploadPaymentDetails(token, application.id, paymentDate, paymentReference);
      setApplication(updated);
      toast.success('Comprobante de pago cargado exitosamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar el pago');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/apoderado">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {application.studentFirstName && application.studentLastName
                ? `${application.studentFirstName} ${application.studentLastName}`
                : 'Solicitud de Admisión'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={STATUS_COLORS[application.status]}>
                {STATUS_LABELS[application.status]}
              </Badge>
              {application.submittedAt && (
                <span className="text-sm text-muted-foreground">
                  Enviada el {format(new Date(application.submittedAt), "d 'de' MMMM, yyyy", { locale: es })}
                </span>
              )}
            </div>
          </div>
        </div>
        {/* Botones de acción */}
        <div className="flex items-center gap-2">
          {application.status !== 'DRAFT' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPdf}
              disabled={pdfLoading}
              title="Descargar ficha en PDF"
            >
              {pdfLoading
                ? <span className="h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full inline-block mr-2" />
                : <FileDown className="h-4 w-4 mr-2" />}
              PDF
            </Button>
          )}
          {canEdit && (
            <Button asChild>
              <Link href={`/apoderado/solicitudes/${application.id}/editar`}>
                {application.status === 'REQUIRES_CORRECTION' ? 'Subsanar' : 'Editar'}
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Banner de Correcciones */}
      {application.status === 'REQUIRES_CORRECTION' && application.correctionRequest && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
            <div>
              <h3 className="font-medium text-orange-800">Correcciones Solicitadas</h3>
              <p className="text-sm text-orange-700 mt-1">{application.correctionRequest}</p>
            </div>
          </div>
        </div>
      )}

      {/* Banner de Rechazo */}
      {application.status === 'REJECTED' && application.rejectionReason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-800">Motivo de Rechazo</h3>
              <p className="text-sm text-red-700 mt-1">{application.rejectionReason}</p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Module */}
      {application.status === 'APPROVED' && (
        <Card className="border-indigo-200 bg-indigo-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-700">
              <Briefcase className="h-5 w-5" />
              Pago de Matrícula Requerido
            </CardTitle>
            <CardDescription className="text-indigo-900/70">
              Para proceder con la matriculación y asignación de cupo, debes realizar el pago de la matrícula.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <h4 className="font-semibold mb-2">Información de Pago</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 text-sm">
                <p><span className="font-medium text-slate-500">Monto de matrícula:</span> $60.00</p>
                <p><span className="font-medium text-slate-500">Beneficiario:</span> Unidad Educativa Fiscomisional Don Bosco</p>
                <p><span className="font-medium text-slate-500">RUC:</span> 1790000000001</p>
                <p><span className="font-medium text-slate-500">Banco:</span> Banco Pichincha</p>
                <p><span className="font-medium text-slate-500">Tipo de cuenta:</span> Ahorros</p>
                <p><span className="font-medium text-slate-500">Número de cuenta:</span> 2200000000</p>
                <p className="md:col-span-2"><span className="font-medium text-slate-500">Concepto:</span> Matrícula {application.studentFirstName} {application.studentLastName} - {gradeLabel} - 2026-2027</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border shadow-sm space-y-4">
              <h4 className="font-semibold">Carga de Comprobante</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Archivo de comprobante (PDF, JPG, PNG - 5MB máx) <span className="text-red-500">*</span></Label>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setPaymentFile(e.target.files?.[0] || null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha de pago <span className="text-red-500">*</span></Label>
                  <Input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Número de comprobante (opcional)</Label>
                  <Input
                    type="text"
                    placeholder="Ej. 123456789"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                  />
                </div>
              </div>
              <Button
                onClick={handlePaymentSubmit}
                disabled={isSubmittingPayment || !paymentFile || !paymentDate}
                className="w-full sm:w-auto"
              >
                {isSubmittingPayment ? 'Cargando...' : 'Cargar comprobante'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Banner de Pago Validado */}
      {application.status === 'PAYMENT_VALIDATED' && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-indigo-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-indigo-800">Pago Validado - Pendiente de Asignación de Paralelo</h3>
              <p className="text-sm text-indigo-700 mt-1">Tu pago fue validado correctamente. Secretaría te asignará un paralelo y completará la matrícula.</p>
            </div>
          </div>
        </div>
      )}

      {/* Card de Matrícula Completada */}
      {application.status === 'MATRICULATED' && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <CheckCircle className="h-5 w-5" />
              ¡Matrícula Exitosa!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-purple-600 font-medium">Grado Asignado</p>
                <p className="font-bold text-purple-900">{gradeLabel}</p>
              </div>
              {application.assignedParallel && (
                <div>
                  <p className="text-xs text-purple-600 font-medium">Paralelo</p>
                  <p className="font-bold text-purple-900 text-lg">{application.assignedParallel}</p>
                </div>
              )}
              {application.shift && (
                <div>
                  <p className="text-xs text-purple-600 font-medium">Jornada</p>
                  <p className="font-bold text-purple-900">{application.shift}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cursillo de Nivelación */}
      {(['CURSILLO_SCHEDULED', 'CURSILLO_APPROVED', 'CURSILLO_REJECTED'] as const).includes(application.status as any) && (() => {
        const isApproved = application.cursilloResult === 'APPROVED';
        const isRejected = application.cursilloResult === 'REJECTED';
        const isPending = !application.cursilloResult;

        // Parsear las notas del cursillo en materias legibles
        // Formato esperado: "Matemáticas: 50% asistencia, 4/10 pts; Física: 75% asistencia, 5/10 pts"
        const parsedSubjects = application.cursilloNotes
          ? application.cursilloNotes.split(';').map(s => s.trim()).filter(Boolean)
          : [];

        const borderColor = isApproved ? 'border-green-200' : isRejected ? 'border-red-200' : 'border-blue-200';

        return (
          <Card className={borderColor} aria-label="Sección de cursillo de nivelación">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Video className="h-5 w-5 text-blue-600" aria-hidden="true" />
                  Cursillo de Nivelación
                </CardTitle>
                <Badge
                  className={
                    isApproved
                      ? 'bg-green-100 text-green-800 border-green-300'
                      : isRejected
                        ? 'bg-red-100 text-red-800 border-red-300'
                        : 'bg-blue-100 text-blue-800 border-blue-300'
                  }
                >
                  {isApproved ? 'Aprobado' : isRejected ? 'Reprobado' : 'En curso'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mensaje específico por estado */}
              {isPending && (
                <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
                  <p className="text-sm font-semibold text-blue-800">Cursillo programado</p>
                  <p className="mt-1 text-sm text-blue-700">
                    Su representado está inscrito en el cursillo de nivelación que inicia el{' '}
                    {application.cursilloDate
                      ? format(new Date(application.cursilloDate), "d 'de' MMMM 'de' yyyy", { locale: es })
                      : '1 de abril de 2026'}.
                    Las sesiones son en línea a través de Microsoft Teams.
                  </p>
                </div>
              )}

              {isApproved && (
                <div className="rounded-md border border-green-200 bg-green-50 p-4">
                  <p className="text-sm font-semibold text-green-800">Cursillo superado con éxito</p>
                  <p className="mt-1 text-sm text-green-700">
                    Su representado aprobó todas las materias del cursillo.
                    El siguiente paso es realizar el pago de matrícula para completar el proceso de admisión.
                  </p>
                </div>
              )}

              {isRejected && (
                <div className="space-y-3">
                  <div className="rounded-md border border-red-200 bg-red-50 p-4">
                    <p className="text-sm font-semibold text-red-800">Cursillo no superado</p>
                    <p className="mt-1 text-sm text-red-700">
                      Lamentablemente su representado no alcanzó los requisitos mínimos en una o más materias
                      del cursillo (asistencia mínima: 80%, nota mínima: 7/10).
                      El cupo ha sido liberado y el proceso de admisión no puede continuar.
                    </p>
                  </div>
                  {parsedSubjects.length > 0 && (
                    <div className="rounded-md border border-red-100 bg-white p-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                        Materias no aprobadas
                      </p>
                      <ul className="space-y-1" aria-label="Materias reprobadas">
                        {parsedSubjects.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <Button
                asChild
                variant={isRejected ? 'outline' : 'default'}
                size="sm"
                className={isRejected ? 'border-red-300 text-red-700 hover:bg-red-50' : ''}
              >
                <Link href={`/apoderado/solicitudes/${application.id}/cursillo`}>
                  <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
                  Ver horarios, materias y resultado completo
                </Link>
              </Button>
            </CardContent>
          </Card>
        );
      })()}

      {/* Datos del Estudiante */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Datos del Estudiante
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem label="Nombres" value={application.studentFirstName} />
            <InfoItem label="Apellidos" value={application.studentLastName} />
            <InfoItem label="Cédula" value={application.studentCedula} />
            <InfoItem label="Género" value={application.studentGender === 'M' ? 'Masculino' : application.studentGender === 'F' ? 'Femenino' : application.studentGender === 'OTHER' ? 'Otro' : undefined} />
            <InfoItem
              label="Fecha de Nacimiento"
              value={application.studentBirthDate
                ? format(new Date(application.studentBirthDate), "d 'de' MMMM, yyyy", { locale: es })
                : undefined
              }
            />
            <InfoItem label="Nacionalidad" value={application.studentNationality} />
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem label="Dirección" value={application.studentAddress} icon={<MapPin className="h-4 w-4" />} />
            <InfoItem label="Sector" value={application.studentSector} />
            <InfoItem label="Teléfono" value={application.studentPhone} icon={<Phone className="h-4 w-4" />} />
            <InfoItem label="Correo" value={application.studentEmail} icon={<Mail className="h-4 w-4" />} />
          </div>

          {(application.hasDisability || application.needsSpecialCare) && (
            <>
              <Separator />
              <div className="space-y-2">
                {application.hasDisability && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="font-medium text-blue-800">Discapacidad</p>
                    <p className="text-sm text-blue-700">{application.disabilityDetail}</p>
                  </div>
                )}
                {application.needsSpecialCare && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="font-medium text-blue-800">Atención Especial</p>
                    <p className="text-sm text-blue-700">{application.specialCareDetail}</p>
                  </div>
                )}
              </div>
            </>
          )}
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
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem label="Grado Solicitado" value={gradeLabel} />
            <InfoItem label="Jornada" value={application.shift || undefined} />
            <InfoItem label="Especialidad" value={application.specialty === 'CIENCIAS' ? 'BGU Ciencias' : application.specialty === 'TECNICO_INFORMATICA' ? 'BGU Técnico Informática' : application.specialty} />
            <InfoItem label="Institución Anterior" value={application.previousSchool} />
            <InfoItem label="Promedio Último Año" value={application.lastYearAverage?.toString()} />
            {application.assignedParallel && (
              <InfoItem label="Paralelo Asignado" value={application.assignedParallel} />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Datos Familiares */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Datos Familiares
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {application.fatherData && (
            <ParentInfo title="Padre" data={application.fatherData} />
          )}
          {application.motherData && (
            <>
              <Separator />
              <ParentInfo title="Madre" data={application.motherData} />
            </>
          )}
          {application.representativeData && (
            <>
              <Separator />
              <ParentInfo
                title={`Representante Legal (${application.representativeData.relationship || 'Sin especificar'})`}
                data={application.representativeData}
              />
            </>
          )}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {application.documents.map((doc) => (
                <a
                  key={doc.id}
                  href={`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/+$/, '')}/${doc.fileUrl.replace(/^\/+/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <FileText className="h-5 w-5 text-blue-500" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{DOCUMENT_LABELS[doc.documentType]}</p>
                    <p className="text-xs text-muted-foreground">{doc.fileName}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No hay documentos cargados</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Componente auxiliar para mostrar info
function InfoItem({
  label,
  value,
  icon
}: {
  label: string;
  value?: string | null;
  icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className="font-medium">
        {value || <span className="text-muted-foreground italic">No especificado</span>}
      </p>
    </div>
  );
}

// Componente para mostrar datos del padre/madre
function ParentInfo({ title, data }: { title: string; data: any }) {
  return (
    <div>
      <h4 className="font-medium mb-3">{title}</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoItem label="Nombres" value={data.names} />
        <InfoItem label="Cédula" value={data.cedula} />
        <InfoItem label="Teléfono" value={data.phone} icon={<Phone className="h-4 w-4" />} />
        <InfoItem label="Correo" value={data.email} icon={<Mail className="h-4 w-4" />} />
        <InfoItem label="Ocupación" value={data.occupation} icon={<Briefcase className="h-4 w-4" />} />
        {data.livesWithStudent !== undefined && (
          <InfoItem
            label="¿Vive con el estudiante?"
            value={data.livesWithStudent ? 'Sí' : 'No'}
          />
        )}
      </div>
    </div>
  );
}
