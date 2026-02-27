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
  GraduationCap
} from "lucide-react";

function DashboardStats() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    // @ts-ignore
    const token = session?.accessToken || session?.user?.accessToken;
    if (token) {
      getGlobalStats(token).then(setStats).catch(console.error);
    }
  }, [session]);

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

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { hasAdminAccess } = useRoles();

  useEffect(() => {
    if (status === "authenticated" && !hasAdminAccess()) {
      router.push("/dashboard");
    }
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, hasAdminAccess, router]);

  if (status === "loading" || (!session || !hasAdminAccess())) {
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

        <DashboardStats />

        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Gestión del Sistema
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <Link href="/admin/users" className="group">
              <Card className="h-full hover:shadow-md transition-all duration-200 hover:border-primary/50 group-hover:bg-slate-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-base">
                    <div className="p-2 bg-blue-100 text-blue-700 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Users className="h-5 w-5" />
                    </div>
                    Gestión de Usuarios
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Administrar cuentas, crear nuevos usuarios y gestionar accesos al sistema.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/roles" className="group">
              <Card className="h-full hover:shadow-md transition-all duration-200 hover:border-primary/50 group-hover:bg-slate-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-base">
                    <div className="p-2 bg-purple-100 text-purple-700 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    Roles y Permisos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Configurar roles, permisos y niveles de acceso para seguridad.
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
                    Reportes y Estadísticas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Visualizar métricas de admisión, nóminas y exportar datos.
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
                    Gestión de Cupos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Configurar disponibilidad de vacantes por nivel educativo.
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

