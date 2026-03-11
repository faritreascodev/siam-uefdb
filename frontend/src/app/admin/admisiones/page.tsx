'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import { getAllApplications, getAssignedApplications, getGlobalStats } from '@/lib/api-admin-applications';
import { Application, ApplicationStats, GRADE_LEVELS } from '@/types/application';
import { useRoles } from '@/hooks/use-roles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { DataTable } from '@/components/ui/data-table';
import { columns } from './columns';
import { bulkApproveApplications, bulkRejectApplications } from '@/lib/api-admin-applications';
import { toast } from 'sonner';

export default function AdminAdmisionesPage() {
  const { data: session } = useSession();
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
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
  const { isRector, isFullAdmin, isSecretaria } = useRoles();
  const onlyAssigned = isRector() && !isFullAdmin() && !isSecretaria();

  // @ts-expect-error - accessToken is added in next-auth callbacks
  const token = session?.accessToken || (session?.user as { accessToken?: string })?.accessToken;

  const loadData = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      let paginatedData;
      let statsData;
      
      const filtersObj = {
          status: filters.status === 'ALL' ? undefined : filters.status,
          gradeLevel: filters.gradeLevel === 'ALL' ? undefined : filters.gradeLevel,
          search: filters.search || undefined,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
          specialty: filters.specialty,
          shift: filters.shift,
          page,
          limit,
      };

      if (onlyAssigned) {
        const [assignedApps, globalStats] = await Promise.all([
          getAssignedApplications(token, filtersObj),
          getGlobalStats(token),
        ]);
        paginatedData = {
          data: assignedApps,
          totalPages: 1, // pseudo-pagination since backend doesn't paginate assigned
          total: assignedApps.length,
          page: 1,
          limit: assignedApps.length || 15
        };
        statsData = globalStats;
      } else {
        const [allApps, globalStats] = await Promise.all([
          getAllApplications(token, filtersObj),
          getGlobalStats(token),
        ]);
        paginatedData = allApps;
        statsData = globalStats;
      }

      setApplications(paginatedData.data);
      setTotalPages(paginatedData.totalPages);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [token, page, filters, limit, onlyAssigned]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 500);
    return () => clearTimeout(timer);
  }, [loadData]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters.status, filters.gradeLevel, filters.search, filters.startDate, filters.endDate, filters.specialty, filters.shift]);

  // Filtro local eliminado a favor de backend filtering


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
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  </div>
                  <Input
                    placeholder="Búsqueda Inteligente: Nombres, Apellidos o Cédula..."
                    className="pl-10 h-11 border-2 focus-visible:ring-primary/20 transition-all hover:border-primary/30"
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
                    <SelectItem value="BGU Ciencias">BGU Ciencias</SelectItem>
                    <SelectItem value="BT Informática">BT Informática</SelectItem>
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
                    <SelectItem value="Matutina">Matutina</SelectItem>
                    <SelectItem value="Vespertina">Vespertina</SelectItem>
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
        <CardContent>
          <DataTable
            columns={columns}
            data={applications}
            bulkActions={(table) => {
              const selectedRows = table.getFilteredSelectedRowModel().rows
              const selectedIds = selectedRows.map((row: { original: { id: string } }) => row.original.id)
              const canApprove = selectedRows.some((row: { original: { status: string } }) => ['SUBMITTED', 'UNDER_REVIEW', 'CURSILLO_APPROVED'].includes(row.original.status))

              const handleBulkApprove = async () => {
                if (!token) return
                try {
                  await bulkApproveApplications(token, selectedIds)
                  toast.success(`${selectedIds.length} solicitudes aprobadas`)
                  loadData()
                  table.resetRowSelection()
                } catch (err: any) {
                  toast.error(err.message)
                }
              }

              const handleBulkReject = async () => {
                if (!token) return
                const reason = window.prompt("Razón del rechazo:")
                if (reason === null) return
                try {
                  await bulkRejectApplications(token, selectedIds, reason)
                  toast.success(`${selectedIds.length} solicitudes rechazadas`)
                  loadData()
                  table.resetRowSelection()
                } catch (err: any) {
                  toast.error(err.message)
                }
              }

              return (
                <div className="flex gap-2 items-center bg-slate-100 p-1 px-2 rounded-md border">
                  <span className="text-xs font-medium mr-2">{selectedIds.length} seleccionadas</span>
                  {canApprove && (
                    <Button size="sm" variant="outline" className="h-8 text-green-600" onClick={handleBulkApprove}>
                      <CheckCircle className="h-3.5 w-3.5 mr-1" /> Aprobar
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="h-8 text-red-600" onClick={handleBulkReject}>
                    <XCircle className="h-3.5 w-3.5 mr-1" /> Rechazar
                  </Button>
                </div>
              )
            }}
          />

          {/* Paginación personalizada (Opcional, DataTable tiene una básica, pero podemos mantener esta sync con totalPages) */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
