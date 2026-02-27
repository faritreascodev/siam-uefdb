"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { reportsApi } from "@/lib/api-reports"
import { DashboardStats } from "./components/dashboard-stats"
import { LevelStatsTable } from "./components/level-stats-table"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Download, RefreshCcw, FileBarChart2, UserX, ArrowLeft, BarChart3 } from "lucide-react"
import { toast } from "sonner"

export default function ReportsPage() {
  const { data: session } = useSession()
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;

  const [loading, setLoading] = useState(true)
  const [dashboardStats, setDashboardStats] = useState<any>(null)
  const [levelStats, setLevelStats] = useState<any[]>([])

  const loadData = async () => {
    if (!token) return
    try {
      setLoading(true)
      const [stats, levels] = await Promise.all([
        reportsApi.getDashboardStats(token),
        reportsApi.getLevelStats(token)
      ])
      setDashboardStats(stats)
      setLevelStats(levels)
    } catch (error) {
      console.error(error)
      toast.error("Error al cargar reportes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) loadData()
  }, [token])

  const handleExport = async () => {
    if (!token) return;
    try {
      const { csv } = await reportsApi.exportAdmittedCsv(token);
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `admitidos-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Exportación completada");
    } catch (error) {
      console.error(error);
      toast.error("Error al exportar datos");
    }
  }

  if (!token) return null

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link 
              href="/admin" 
              className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Panel
            </Link>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            Reportes y Estadísticas
          </h2>
          <p className="text-muted-foreground mt-1">
            Visión general del proceso de admisión 2026-2027
          </p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Exportar Excel
          </Button>
        </div>
      </div>

      {dashboardStats && (
        <DashboardStats stats={dashboardStats} />
      )}

      {/* Report Navigation Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/reportes/nomina" className="group">
          <Card className="h-full hover:shadow-md transition-all duration-200 hover:border-primary/50 group-hover:bg-slate-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-base">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <FileBarChart2 className="h-5 w-5" />
                </div>
                Nómina por Curso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Listado detallado de estudiantes matriculados clasificados por curso, jornada y paralelo.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/reportes/sin-asignar" className="group">
          <Card className="h-full hover:shadow-md transition-all duration-200 hover:border-orange-500/50 group-hover:bg-orange-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-base">
                <div className="p-2 bg-orange-100 text-orange-700 rounded-lg group-hover:bg-orange-600 group-hover:text-white transition-colors">
                  <UserX className="h-5 w-5" />
                </div>
                Estudiantes sin Asignar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Gestión de estudiantes aprobados que requieren asignación de paralelo.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-xl font-semibold tracking-tight">Desglose por Nivel Educativo</h3>
        <LevelStatsTable data={levelStats} />
      </div>
    </div>
  )
}
