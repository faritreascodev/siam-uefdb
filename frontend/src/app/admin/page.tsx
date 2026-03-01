"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRoles } from "@/hooks/use-roles";
import { useEffect, useState } from "react";
import { getGlobalStats } from "@/lib/api-applications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  ShieldCheck,
  BarChart3,
  Settings,
  LogOut,
  ArrowLeft,
  UserCheck,
  Clock,
  FileEdit,
  LayoutDashboard,
  GraduationCap,
  FileText,
  History
} from "lucide-react";

function DashboardStats({ stats }: { stats: any }) {
  if (!stats) return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
          </CardHeader>
          <CardContent>
            <div className="h-8 w-16 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Solicitudes</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground mt-1">
            En el periodo actual
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Aprobadas</CardTitle>
          <UserCheck className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Estudiantes admitidos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
          <Clock className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">
            {(stats.submitted || 0) + (stats.underReview || 0)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Por revisar
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Borradores</CardTitle>
          <FileEdit className="h-4 w-4 text-slate-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-600">{stats.draft}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Incompletas
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function AdmissionFunnel({ stats }: { stats: any }) {
  if (!stats) return null;

  const total = stats.total || 1;
  const stages = [
    { label: 'Solicitudes Totales', value: stats.total, color: 'bg-slate-200' },
    { label: 'Enviadas / Revisión', value: (stats.submitted || 0) + (stats.underReview || 0), color: 'bg-blue-100 text-blue-700' },
    { label: 'Aprobadas', value: stats.approved, color: 'bg-green-100 text-green-700 font-bold' },
    { label: 'Matriculados', value: stats.matriculated || 0, color: 'bg-primary text-white font-bold' },
  ];

  return (
    <div className="space-y-4">
      {stages.map((stage, i) => {
        const percentage = Math.round((stage.value / total) * 100);
        return (
          <div key={i} className="space-y-1">
            <div className="flex justify-between text-xs font-medium">
              <span>{stage.label}</span>
              <span>{stage.value} ({percentage}%)</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-8 overflow-hidden border">
              <div
                className={`h-full flex items-center px-3 text-xs transition-all duration-1000 ${stage.color}`}
                style={{ width: `${Math.max(10, percentage)}%` }}
              >
                {percentage > 15 && `${percentage}%`}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  );
}


function DashboardStatsWithFunnel() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    // @ts-ignore
    const token = session?.accessToken || session?.user?.accessToken;
    if (token) {
      getGlobalStats(token).then(setStats).catch(console.error);
    }
  }, [session]);

  return (
    <div className="space-y-6 mb-8">
      <DashboardStats stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-primary">
              <BarChart3 className="h-5 w-5" />
              Embudo de Proceso de Admisión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AdmissionFunnel stats={stats} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Resumen Diario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground border-2 border-dashed rounded-lg bg-slate-50/50">
              <Clock className="h-8 w-8 mb-2 opacity-20" />
              <p className="text-sm">Sin pendientes para hoy</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isAdmin, isSuperAdmin, isDirectivo } = useRoles();
  const canViewMap = status === "authenticated" && (isAdmin() || isSuperAdmin() || isDirectivo());

  useEffect(() => {
    if (status === "authenticated" && !canViewMap) {
      router.push("/admin/admisiones");
    }
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, canViewMap, router]);

  if (status === "loading" || (!session || !canViewMap)) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Cargando panel...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <nav className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-primary">
                <LayoutDashboard className="h-6 w-6" />
                <h1 className="text-xl font-bold tracking-tight">Panel Administrativo</h1>
              </div>
              <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>
              <Link
                href="/dashboard"
                className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al sitio
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium leading-none">{session.user.name || session.user.email}</p>
                <p className="text-xs text-muted-foreground mt-1">Administrador</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">

        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Bienvenido de nuevo</h2>
          <p className="text-muted-foreground mt-2">
            Resumen de actividad y gestión del sistema académico.
          </p>
        </div>

        <DashboardStatsWithFunnel />

        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Accesos Directos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            <Link href="/admin/admisiones" className="group">
              <Card className="h-full hover:shadow-md transition-all duration-200 hover:border-primary/50 group-hover:bg-slate-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-base">
                    <div className="p-2 bg-blue-100 text-blue-700 rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                      <FileText className="h-5 w-5" />
                    </div>
                    Admisiones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Revisar, aprobar y procesar solicitudes de ingreso estudiantil.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/cursillos" className="group">
              <Card className="h-full hover:shadow-md transition-all duration-200 hover:border-primary/50 group-hover:bg-slate-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-base">
                    <div className="p-2 bg-amber-100 text-amber-700 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors">
                      <Clock className="h-5 w-5" />
                    </div>
                    Gestión de Cursillos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Organizar fechas y registrar resultados de los cursos de admisión.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/users" className="group">
              <Card className="h-full hover:shadow-md transition-all duration-200 hover:border-primary/50 group-hover:bg-slate-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-base">
                    <div className="p-2 bg-slate-100 text-slate-700 rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                      <Users className="h-5 w-5" />
                    </div>
                    Usuarios
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Administrar cuentas, crear nuevos usuarios y gestionar accesos.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/cupos" className="group">
              <Card className="h-full hover:shadow-md transition-all duration-200 hover:border-primary/50 group-hover:bg-slate-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-base">
                    <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    Cupos y Vacantes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Configurar disponibilidad de vacantes por nivel educativo y sección.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/reportes" className="group">
              <Card className="h-full hover:shadow-md transition-all duration-200 hover:border-primary/50 group-hover:bg-slate-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-base">
                    <div className="p-2 bg-orange-100 text-orange-700 rounded-lg group-hover:bg-orange-600 group-hover:text-white transition-colors">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    Reportes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Generar nóminas, estadísticas de admisión y exportar datos.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/settings" className="group">
              <Card className="h-full hover:shadow-md transition-all duration-200 hover:border-primary/50 group-hover:bg-slate-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-base">
                    <div className="p-2 bg-slate-100 text-slate-700 rounded-lg group-hover:bg-slate-900 group-hover:text-white transition-colors">
                      <Settings className="h-5 w-5" />
                    </div>
                    Configuración
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Ajustes generales del sistema y periodos lectivos.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/auditoria" className="group">
              <Card className="h-full hover:shadow-md transition-all duration-200 hover:border-primary/50 group-hover:bg-slate-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-base">
                    <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <History className="h-5 w-5" />
                    </div>
                    Auditoría
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Ver bitácora de acciones y cambios realizados en el sistema.
                  </p>
                </CardContent>
              </Card>
            </Link>

          </div>
        </div>

        <div className="mt-12 pt-6 border-t text-center text-xs text-muted-foreground">
          <p>SIAM - UEFDB v1.0.0 &copy; 2026. Todos los derechos reservados.</p>
        </div>
      </main>
    </div>
  );
}

