'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { getAssignedApplications } from '@/lib/api-admin-applications';
import { Application, STATUS_LABELS, STATUS_COLORS, GRADE_LEVELS } from '@/types/application';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FileText,
  Search,
  Eye,
  ClipboardList,
  MessageSquare,
  User,
  Filter,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AsignadasPage() {
  const { data: session } = useSession();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'ALL',
    gradeLevel: 'ALL',
    search: '',
    startDate: '',
    endDate: '',
    specialty: undefined as string | undefined,
    shift: undefined as string | undefined
  });

  // @ts-ignore
  const token = session?.accessToken || session?.user?.accessToken;
  // @ts-ignore
  const userName = session?.user?.firstName || session?.user?.name || 'Usuario';

  useEffect(() => {
    async function loadData() {
      if (!token) return;

      try {
        const data = await getAssignedApplications(token, {
          status: filters.status === 'ALL' ? undefined : filters.status,
          gradeLevel: filters.gradeLevel === 'ALL' ? undefined : filters.gradeLevel,
          search: filters.search || undefined,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
          specialty: filters.specialty,
          shift: filters.shift,
        });
        setApplications(data);
      } catch (error) {
        console.error('Error loading assigned applications:', error);
      } finally {
        setLoading(false);
      }
    }

    // Debounce search
    const timer = setTimeout(() => {
      loadData();
    }, 500);
    return () => clearTimeout(timer);
  }, [token, filters.status, filters.gradeLevel, filters.search, filters.startDate, filters.endDate, filters.specialty, filters.shift]);

  // Filtro backend
  const filteredApplications = applications;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ClipboardList className="h-8 w-8" />
            Mis Solicitudes Asignadas
          </h1>
          <p className="text-muted-foreground mt-1">
            Solicitudes de admisión asignadas para tu revisión
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          {userName}
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Asignadas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applications.length}</div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendientes de Acción</CardTitle>
            <MessageSquare className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {applications.filter(a => ['SUBMITTED', 'UNDER_REVIEW'].includes(a.status)).length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Procesadas</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {applications.filter(a => ['APPROVED', 'REJECTED'].includes(a.status)).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {/* Fila 1 */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre o cédula..."
                    className="pl-9"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos los estados</SelectItem>
                    <SelectItem value="SUBMITTED">Enviadas</SelectItem>
                    <SelectItem value="UNDER_REVIEW">En Revisión</SelectItem>
                    <SelectItem value="REQUIRES_CORRECTION">Corrección</SelectItem>
                    <SelectItem value="APPROVED">Aprobadas</SelectItem>
                    <SelectItem value="REJECTED">Rechazadas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Fila 2 */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-48">
                <Select
                  value={filters.gradeLevel}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, gradeLevel: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Grado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos los grados</SelectItem>
                    {GRADE_LEVELS.map(grade => (
                      <SelectItem key={grade.value} value={grade.value}>{grade.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:w-48">
                <Select
                  value={filters.specialty || 'ALL'}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, specialty: value === 'ALL' ? undefined : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Especialidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todas</SelectItem>
                    <SelectItem value="Ciencias">Ciencias</SelectItem>
                    <SelectItem value="Técnico">Técnico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2 items-center">
                <Input
                  type="date"
                  className="w-full md:w-40"
                  value={filters.startDate || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="date"
                  className="w-full md:w-40"
                  value={filters.endDate || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitudes ({filteredApplications.length})</CardTitle>
          <CardDescription>
            Revisa y procesa las solicitudes asignadas a ti
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredApplications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardList className="mx-auto h-12 w-12 opacity-30 mb-2" />
              <p>
                {applications.length === 0 
                  ? 'No tienes solicitudes asignadas'
                  : 'No hay solicitudes que coincidan con la búsqueda'
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>Año</TableHead>
                  <TableHead>Grado / Esp.</TableHead>
                  <TableHead>Procesado Por</TableHead>
                  <TableHead>Fecha Asignación</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Comentarios</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">
                      <div>{app.studentFirstName} {app.studentLastName}</div>
                      <div className="text-xs text-muted-foreground md:hidden">{app.studentCedula}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{app.studentCedula || '-'}</TableCell>
                    <TableCell>2026-2027</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{GRADE_LEVELS.find(g => g.value === app.gradeLevel)?.label || app.gradeLevel || '-'}</span>
                        {app.specialty && <span className="text-xs text-muted-foreground">{app.specialty}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {app.processedBy ? (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{app.processedBy.firstName} {app.processedBy.lastName}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {app.assignedAt
                        ? formatDistanceToNow(new Date(app.assignedAt), { addSuffix: true, locale: es })
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[app.status]}>
                        {STATUS_LABELS[app.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MessageSquare className="h-4 w-4" />
                        <span>{app.internalComments?.length || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/admisiones/${app.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Revisar
                        </Link>
                      </Button>
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
