'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { getAllApplications, getGlobalStats, PaginatedResponse } from '@/lib/api-admin-applications';
import { Application, ApplicationStats, GRADE_LEVELS, STATUS_LABELS, STATUS_COLORS } from '@/types/application';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Eye,
  Filter,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminAdmisionesPage() {
  const { data: session } = useSession();
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ 
    status: 'ALL', 
    gradeLevel: 'ALL', 
    search: '',
    startDate: '',
    endDate: '',
    specialty: undefined as string | undefined,
    shift: undefined as string | undefined
  });
  const limit = 15;

  // @ts-ignore
  const token = session?.accessToken || session?.user?.accessToken;

  const loadData = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const [paginatedData, statsData] = await Promise.all([
        getAllApplications(token, {
          status: filters.status === 'ALL' ? undefined : filters.status,
          gradeLevel: filters.gradeLevel === 'ALL' ? undefined : filters.gradeLevel,
          search: filters.search || undefined, // Send search to backend
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
          specialty: filters.specialty,
          shift: filters.shift,
          page,
          limit,
        }),
        getGlobalStats(token),
      ]);
      setApplications(paginatedData.data);
      setTotal(paginatedData.total);
      setTotalPages(paginatedData.totalPages);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search? For now direct call or we can add debounce
    const timer = setTimeout(() => {
      loadData();
    }, 500);
    return () => clearTimeout(timer);
  }, [token, page, filters.status, filters.gradeLevel, filters.search, filters.startDate, filters.endDate, filters.specialty, filters.shift]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters.status, filters.gradeLevel, filters.search, filters.startDate, filters.endDate, filters.specialty, filters.shift]);

  // Filtro local eliminado a favor de backend filtering
  const filteredApplications = applications;

  if (loading && applications.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Gestión de Admisiones</h1>
        <p className="text-muted-foreground">
          Revisa y procesa las solicitudes de admisión
        </p>
      </div>

      {/* Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{(stats?.submitted || 0) + (stats?.underReview || 0)}</div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">En Corrección</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.requiresCorrection || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aprobadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.approved || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Matriculadas</CardTitle>
            <GraduationCap className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">{stats?.matriculated || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rechazadas</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.rejected || 0}</div>
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
            {/* Fila 1: Búsqueda y Estados */}
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

            {/* Fila 2: Filtros Específicos */}
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

              <div className="w-full md:w-40">
                <Select
                  value={filters.shift || 'ALL'}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, shift: value === 'ALL' ? undefined : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Jornada" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todas</SelectItem>
                    <SelectItem value="MORNING">Matutina</SelectItem>
                    <SelectItem value="AFTERNOON">Vespertina</SelectItem>
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

      {/* Tabla de Solicitudes */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitudes ({total})</CardTitle>
          <CardDescription>
            Mostrando {filteredApplications.length} de {total} solicitudes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredApplications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 opacity-30 mb-2" />
              <p>No hay solicitudes que coincidan con los filtros</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>DNI</TableHead>
                    <TableHead>Año Solicitado</TableHead>
                    <TableHead>Grado / Esp.</TableHead>
                    <TableHead>Fecha Envío</TableHead>
                    <TableHead>Estado</TableHead>
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
                        {app.submittedAt
                          ? formatDistanceToNow(new Date(app.submittedAt), { addSuffix: true, locale: es })
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[app.status]}>
                          {STATUS_LABELS[app.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/admisiones/${app.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Página {page} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
