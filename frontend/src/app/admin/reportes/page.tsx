"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { reportsApi } from "@/lib/api-reports"
import { DashboardStats } from "./components/dashboard-stats"
import { LevelStatsTable } from "./components/level-stats-table"
import { Button } from "@/components/ui/button"
import { Download, RefreshCcw } from "lucide-react"
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
      
      // Create Blob and download
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
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reportes y Estadísticas</h2>
          <p className="text-muted-foreground">
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <a href="/admin/reportes/nomina" className="block p-6 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold mb-2">Nómina por Curso</h3>
          <p className="text-sm text-gray-500">Listado de estudiantes matriculados por curso, jornada y paralelo.</p>
        </a>
        <a href="/admin/reportes/sin-asignar" className="block p-6 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold mb-2 text-orange-600">Estudiantes sin Asignar</h3>
          <p className="text-sm text-gray-500">Estudiantes aprobados que aún no tienen paralelo asignado.</p>
        </a>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Desglose por Nivel Educativo</h3>
        <LevelStatsTable data={levelStats} />
      </div>
    </div>
  )
}
