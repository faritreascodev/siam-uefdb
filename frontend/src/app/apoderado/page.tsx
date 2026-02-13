'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { getMyApplications, getMyStats, deleteApplication } from '@/lib/api-applications';
import { Application, ApplicationStats, ApplicationStatus, STATUS_LABELS, STATUS_COLORS } from '@/types/application';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FileText, 
  Clock, 
  Send, 
  AlertCircle, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  MoreHorizontal,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ImportantNotificationsBanner } from '@/components/important-notifications-banner';
import { toast } from 'sonner';

export default function ApoderadoDashboard() {
  const { data: session } = useSession();
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // @ts-ignore
  const token = session?.accessToken || session?.user?.accessToken;

  const loadData = async () => {
    if (!token) return;
    
    try {
      const [appsData, statsData] = await Promise.all([
        getMyApplications(token as string),
        getMyStats(token as string),
      ]);
      setApplications(appsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [session]);

  const handleDelete = async (applicationId: string) => {
    if (!token) return;
    if (!confirm('¿Estás seguro de eliminar esta solicitud?')) return;

    try {
      await deleteApplication(token, applicationId);
      toast.success('Solicitud eliminada');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar');
    }
  };

  // Filtrar aplicaciones
  const filteredApplications = applications.filter(app => {
    const matchesSearch = searchQuery === '' || 
      `${app.studentFirstName} ${app.studentLastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header de Bienvenida */}
      <div>
        <h1 className="text-3xl font-bold">
          ¡Bienvenido, {session?.user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Gestiona las solicitudes de admisión de tus representados
        </p>
      </div>

      {/* Banner de Notificaciones Importantes */}
      <ImportantNotificationsBanner />

      {/* Tarjetas de Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Solicitudes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">En Borrador</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats?.draft || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Enviadas / En Revisión</CardTitle>
            <Send className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.submitted || 0}</div>
          </CardContent>
        </Card>

        <Card className={stats?.requiresCorrection ? 'border-orange-300 bg-orange-50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Requieren Corrección</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.requiresCorrection || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-green-300 bg-green-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aprobadas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.approved || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-red-300 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rechazadas</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.rejected || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Solicitudes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Mis Solicitudes</CardTitle>
            <CardDescription>
              Listado de todas las solicitudes de admisión
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/apoderado/solicitudes/nueva">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Solicitud
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {/* Barra de Filtros */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="DRAFT">Borrador</SelectItem>
                <SelectItem value="SUBMITTED">Enviada</SelectItem>
                <SelectItem value="UNDER_REVIEW">En Revisión</SelectItem>
                <SelectItem value="REQUIRES_CORRECTION">Requiere Corrección</SelectItem>
                <SelectItem value="APPROVED">Aprobada</SelectItem>
                <SelectItem value="REJECTED">Rechazada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {applications.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-medium">No hay solicitudes</h3>
              <p className="text-muted-foreground mt-1">
                Crea tu primera solicitud de admisión
              </p>
              <Button className="mt-4" asChild>
                <Link href="/apoderado/solicitudes/nueva">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Solicitud
                </Link>
              </Button>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron solicitudes con los filtros aplicados
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Grado</TableHead>
                  <TableHead>Fecha de Envío</TableHead>
                  <TableHead>Última Actualización</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">
                      {app.studentFirstName && app.studentLastName
                        ? `${app.studentFirstName} ${app.studentLastName}`
                        : <span className="text-muted-foreground italic">Sin nombre</span>
                      }
                    </TableCell>
                    <TableCell>
                      {app.gradeLevel || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      {app.submittedAt ? (
                        <span className="text-sm">
                          {format(new Date(app.submittedAt), 'dd MMM yyyy', { locale: es })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic text-sm">No enviada</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(app.updatedAt), { 
                          addSuffix: true, 
                          locale: es 
                        })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[app.status]}>
                        {STATUS_LABELS[app.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <ApplicationActions application={app} onDelete={handleDelete} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Componente de acciones por solicitud
function ApplicationActions({ 
  application, 
  onDelete 
}: { 
  application: Application; 
  onDelete: (id: string) => void;
}) {
  const canEdit = ['DRAFT', 'REQUIRES_CORRECTION'].includes(application.status);
  const canDelete = application.status === 'DRAFT';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/apoderado/solicitudes/${application.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            Ver Detalle
          </Link>
        </DropdownMenuItem>
        
        {canEdit && (
          <DropdownMenuItem asChild>
            <Link href={`/apoderado/solicitudes/${application.id}/editar`}>
              <Edit className="mr-2 h-4 w-4" />
              {application.status === 'REQUIRES_CORRECTION' ? 'Subsanar' : 'Editar'}
            </Link>
          </DropdownMenuItem>
        )}
        
        {canDelete && (
          <DropdownMenuItem 
            className="text-red-600"
            onClick={() => onDelete(application.id)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
