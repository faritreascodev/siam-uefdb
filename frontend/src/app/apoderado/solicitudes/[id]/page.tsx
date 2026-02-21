'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApplication } from '@/lib/api-applications';
import { Application, STATUS_LABELS, STATUS_COLORS, DOCUMENT_LABELS, GRADE_LEVELS } from '@/types/application';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  ExternalLink
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
        {canEdit && (
          <Button asChild>
            <Link href={`/apoderado/solicitudes/${application.id}/editar`}>
              {application.status === 'REQUIRES_CORRECTION' ? 'Subsanar' : 'Editar'}
            </Link>
          </Button>
        )}
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
            <InfoItem label="Género" value={application.studentGender === 'M' ? 'Masculino' : 'Femenino'} />
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
            <InfoItem label="Jornada" value={application.shift === 'MATUTINA' ? 'Matutina' : 'Vespertina'} />
            <InfoItem label="Institución Anterior" value={application.previousSchool} />
            <InfoItem label="Promedio Último Año" value={application.lastYearAverage?.toString()} />
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
                  href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${doc.fileUrl}`}
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
