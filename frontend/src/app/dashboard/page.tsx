"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRoles } from "@/hooks/use-roles";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  User,
  Shield,
  Baby,
  Users,
  FileStack,
  Settings,
  Inbox,
  ClipboardList,
  Info,
  GraduationCap,
  Clock
} from "lucide-react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { hasAdminAccess, isApoderado, isDirectivo, isSecretaria, roles, canManageUsers, isFullAdmin, isRector } = useRoles();

  if (status === "loading") {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Cargando panel...</div>;
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  if ((session?.user as any)?.status === 'PENDIENTE_APROBACION') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md border border-amber-200">
          <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="h-8 w-8 text-amber-600 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Registro en Revisión</h2>
          <p className="text-muted-foreground mb-6">
            Tu cuenta ha sido creada exitosamente. Un administrador debe revisar y aprobar tu registro antes de que puedas acceder a todas las funcionalidades.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 mb-6">
            <p className="font-medium">¿Qué sigue?</p>
            <p className="mt-1">Recibirás un correo electrónico una vez que tu cuenta sea activada.</p>
          </div>
          <Button
            variant="outline"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <nav className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2 text-primary">
              <GraduationCap className="h-6 w-6" />
              <h1 className="text-xl font-bold tracking-tight">SIAM - UEFDB</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium leading-none">{session.user.email}</p>
                <p className="text-xs text-muted-foreground mt-1 capitalize">{roles[0] || 'Usuario'}</p>
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
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Hola, {session.user.name || session.user.email}</h2>
          <p className="text-muted-foreground mt-2">
            Bienvenido a tu panel personal. Aquí puedes gestionar tus actividades.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Sidebar - User Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-primary" />
                  Tu Perfil
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-sm">{session.user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Roles Asignados</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {roles.map((role) => (
                        <span key={role} className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium capitalize">
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground">ID: {session.user.id}</p>
                  </div>
                  <div className="pt-4 mt-2">
                    <Link href="/perfil" className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium transition-colors">
                      <Settings className="h-4 w-4" />
                      Gestionar Mi Perfil
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-lg font-semibold tracking-tight">Accesos Rápidos</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Portal de Apoderado - Para guardians */}
              {isApoderado() && (
                <Link href="/apoderado" className="group">
                  <Card className="h-full hover:shadow-md transition-all duration-200 hover:border-green-500/50 group-hover:bg-green-50/10">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-base">
                        <div className="p-2 bg-green-100 text-green-700 rounded-lg group-hover:bg-green-600 group-hover:text-white transition-colors">
                          <Baby className="h-5 w-5" />
                        </div>
                        Portal de Apoderado
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Gestionar matrículas y solicitudes de tus representados.
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              )}

              {/* Usuarios - Para admins */}
              {canManageUsers() && (
                <Link href="/admin/users" className="group">
                  <Card className="h-full hover:shadow-md transition-all duration-200 hover:border-primary/50 group-hover:bg-slate-50/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-base">
                        <div className="p-2 bg-blue-100 text-primary rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                          <Users className="h-5 w-5" />
                        </div>
                        Gestión de Usuarios
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Control de acceso y cuentas del sistema.
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              )}

              {/* Admisiones - Para admins y rector */}
              {(isFullAdmin() || isRector()) && (
                <Link href="/admin/admisiones" className="group">
                  <Card className="h-full hover:shadow-md transition-all duration-200 hover:border-primary/50 group-hover:bg-slate-50/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-base">
                        <div className="p-2 bg-purple-100 text-purple-700 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
                          <FileStack className="h-5 w-5" />
                        </div>
                        Solicitudes de Admisión
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Revisar y gestionar el proceso de admisión general.
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              )}

              {/* Panel Admin - Para admins */}
              {isFullAdmin() && (
                <Link href="/admin" className="group">
                  <Card className="h-full hover:shadow-md transition-all duration-200 hover:border-primary/50 group-hover:bg-slate-50/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-base">
                        <div className="p-2 bg-slate-100 text-slate-700 rounded-lg group-hover:bg-slate-600 group-hover:text-white transition-colors">
                          <Settings className="h-5 w-5" />
                        </div>
                        Panel Administrativo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Configuración global, reportes y estadísticas.
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              )}

              {/* Secretaria - Solicitudes recibidas */}
              {isSecretaria() && (
                <Link href="/admin/admisiones" className="group">
                  <Card className="h-full hover:shadow-md transition-all duration-200 hover:border-primary/50 group-hover:bg-blue-50/10">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-base">
                        <div className="p-2 bg-blue-100 text-primary rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                          <Inbox className="h-5 w-5" />
                        </div>
                        Bandeja de Entrada
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Procesar nuevas solicitudes de matrícula recibidas.
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              )}

              {/* Directivo - Solicitudes asignadas */}
              {isDirectivo() && (
                <Link href="/admin/admisiones/asignadas" className="group">
                  <Card className="h-full hover:shadow-md transition-all duration-200 hover:border-purple-500/50 group-hover:bg-purple-50/10">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-base">
                        <div className="p-2 bg-purple-100 text-purple-700 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
                          <ClipboardList className="h-5 w-5" />
                        </div>
                        Mis Asignaciones
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Evaluar y calificar solicitudes asignadas a mi cargo.
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              )}
            </div>

            {/* Mensaje informativo si no tiene acceso a nada especial */}
            {!hasAdminAccess() && !isApoderado() && !isDirectivo() && !isSecretaria() && (
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="pt-6 flex items-start gap-4">
                  <Info className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">Cuenta sin roles activos</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Tu cuenta está registrada pero no tiene roles asignados para realizar acciones. Por favor contacta al administrador del sistema.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}