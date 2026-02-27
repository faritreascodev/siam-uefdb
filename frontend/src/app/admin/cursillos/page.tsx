'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { getAllApplications } from '@/lib/api-admin-applications';
import { Application, GRADE_LEVELS, STATUS_LABELS, STATUS_COLORS } from '@/types/application';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Calendar, Search, Filter, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CursilloActions } from './components/cursillo-actions';

export default function AdminCursillosPage() {
  const { data: session } = useSession();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ 
    status: 'ALL', 
    gradeLevel: 'ALL', 
    search: '',
  });
  const limit = 15;

  // @ts-ignore
  const token = session?.accessToken || session?.user?.accessToken;

  const loadData = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const paginatedData = await getAllApplications(token, {
        status: filters.status === 'ALL' ? undefined : filters.status,
        // Si no selecciona uno especifico, traemos solo los grados que requieren cursillo
        gradeLevel: filters.gradeLevel === 'ALL' ? undefined : filters.gradeLevel,
        search: filters.search || undefined,
        page,
        limit,
      });
      
      // Filtrar localmente solo los grados que aplican para cursillo si piden "ALL"
      // Lo ideal es que el backend tenga un filtro "gradeLevelIn", pero lo manejamos así por simplicidad del MVP
      let filteredData = paginatedData.data;
      if (filters.gradeLevel === 'ALL') {
         filteredData = filteredData.filter(app => ['8vo EGB', '1ero BGU'].includes(app.gradeLevel || ''));
      }

      setApplications(filteredData);
      setTotal(filters.gradeLevel === 'ALL' ? filteredData.length : paginatedData.total);
      setTotalPages(paginatedData.totalPages);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 500);
    return () => clearTimeout(timer);
  }, [token, page, filters.status, filters.gradeLevel, filters.search]);

  useEffect(() => {
    setPage(1);
  }, [filters.status, filters.gradeLevel, filters.search]);

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
        <h1 className="text-3xl font-bold">Gestión de Cursillos</h1>
        <p className="text-muted-foreground">
          Gestione las fechas y puntajes de los cursillos de admisión (Aplica solo para 8vo EGB y 1ero BGU)
        </p>
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
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar aspirante..."
                  className="pl-9"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="w-full md:w-48">
              <Select
                value={filters.gradeLevel}
                onValueChange={(value) => setFilters(prev => ({ ...prev, gradeLevel: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Grado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">8vo EGB y 1ero BGU</SelectItem>
                  <SelectItem value="8vo EGB">8vo EGB</SelectItem>
                  <SelectItem value="1ero BGU">1ero BGU</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-56">
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Cualquier Estado</SelectItem>
                  <SelectItem value="UNDER_REVIEW">Sin Programar</SelectItem>
                  <SelectItem value="CURSILLO_SCHEDULED">Programado</SelectItem>
                  <SelectItem value="CURSILLO_APPROVED">Aprobado</SelectItem>
                  <SelectItem value="CURSILLO_REJECTED">Reprobado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Aspirantes ({applications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="mx-auto h-12 w-12 opacity-30 mb-2" />
              <p>No hay aspirantes para cursillos con estos filtros</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Grado</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Programado Para</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">
                        {app.studentFirstName} {app.studentLastName}
                        <div className="text-xs text-muted-foreground block">{app.studentCedula}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{app.gradeLevel}</span>
                          {app.specialty && <span className="text-xs text-muted-foreground">{app.specialty}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[app.status] || 'bg-gray-100 text-gray-800'}>
                          {STATUS_LABELS[app.status] || app.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {app.cursilloDate 
                          ? format(new Date(app.cursilloDate), "dd MMM yyyy", { locale: es })
                          : <span className="text-muted-foreground">Pendiente</span>}
                      </TableCell>
                      <TableCell>
                        {app.cursilloResult === 'APPROVED' && <span className="text-green-600 font-medium">Aprobado</span>}
                        {app.cursilloResult === 'REJECTED' && <span className="text-red-600 font-medium">Reprobado</span>}
                        {app.cursilloResult === 'PENDING' && <span className="text-muted-foreground">Por Evaluar</span>}
                        {app.cursilloNotes && <div className="text-xs text-muted-foreground italic truncate max-w-[150px]" title={app.cursilloNotes}>{app.cursilloNotes}</div>}
                      </TableCell>
                      <TableCell className="text-right">
                        <CursilloActions application={app} onSuccess={loadData} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
