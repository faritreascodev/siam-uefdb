'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApplication } from '@/lib/api-applications';
import { Application, STATUS_LABELS, GRADE_LEVELS } from '@/types/application';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle2, 
  ArrowRight, 
  FileText, 
  Calendar, 
  Hash,
  Clock,
  Home,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { use } from 'react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ConfirmacionPage({ params }: PageProps) {
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
        // Verificar que la solicitud fue enviada
        if (app.status === 'DRAFT') {
          router.push(`/apoderado/solicitudes/${id}/editar`);
          return;
        }
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

  const gradeLabel = GRADE_LEVELS.find(g => g.value === application.gradeLevel)?.label || application.gradeLevel;

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8">
      {/* Header de Confirmación */}
      <div className="text-center space-y-4">
        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-green-700">
          ¡Solicitud Enviada Exitosamente!
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Tu solicitud de admisión ha sido recibida y será revisada por nuestro equipo.
        </p>
      </div>

      {/* Comprobante / Resumen */}
      <Card className="border-green-200">
        <CardHeader className="bg-green-50/50 border-b border-green-100">
          <CardTitle className="flex items-center gap-2 text-green-800">
            <FileText className="h-5 w-5" />
            Comprobante de Envío
          </CardTitle>
          <CardDescription>
            Guarda esta información como referencia
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {/* Número de Referencia */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Hash className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Número de Referencia</p>
              <p className="font-mono font-bold text-lg">{application.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>

          {/* Fecha y Hora */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Fecha de Envío</p>
              <p className="font-medium">
                {application.submittedAt 
                  ? format(new Date(application.submittedAt), "EEEE, d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })
                  : 'Sin fecha'
                }
              </p>
            </div>
          </div>

          <Separator />

          {/* Datos del Estudiante */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Estudiante</p>
              <p className="font-medium">{application.studentFirstName} {application.studentLastName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cédula</p>
              <p className="font-medium">{application.studentCedula || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Grado Solicitado</p>
              <p className="font-medium">{gradeLabel}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Documentos</p>
              <p className="font-medium">{application.documents?.length || 0} archivos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Próximos Pasos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            ¿Qué sigue ahora?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">1</span>
              <div>
                <p className="font-medium">Revisión Inicial</p>
                <p className="text-sm text-muted-foreground">
                  Nuestro equipo de secretaría revisará tu solicitud en los próximos días hábiles.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">2</span>
              <div>
                <p className="font-medium">Notificaciones</p>
                <p className="text-sm text-muted-foreground">
                  Recibirás notificaciones en tu portal sobre el estado de tu solicitud.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">3</span>
              <div>
                <p className="font-medium">Correcciones (si aplica)</p>
                <p className="text-sm text-muted-foreground">
                  Si se requiere información adicional, podrás subsanar desde tu portal.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-medium">4</span>
              <div>
                <p className="font-medium">Resultado Final</p>
                <p className="text-sm text-muted-foreground">
                  Te notificaremos cuando tu solicitud haya sido aprobada o si fue rechazada con el motivo.
                </p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Acciones */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button variant="outline" asChild>
          <Link href={`/apoderado/solicitudes/${application.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            Ver Solicitud
          </Link>
        </Button>
        <Button asChild>
          <Link href="/apoderado">
            <Home className="mr-2 h-4 w-4" />
            Ir al Inicio
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
