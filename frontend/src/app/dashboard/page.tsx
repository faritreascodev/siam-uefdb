"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRoles } from "@/hooks/use-roles";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { hasAdminAccess, isGuardian, isDirectivo, isSecretary, roles } = useRoles();

  if (status === "loading") {
    return <div className="flex min-h-screen items-center justify-center">Cargando...</div>;
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">Academic System</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {session.user.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">
              Bienvenido, {session.user.name || session.user.email}! 👋
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">Información de Usuario:</h3>
                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                  <li><strong>Email:</strong> {session.user.email}</li>
                  <li><strong>Roles:</strong> {roles.join(", ")}</li>
                  <li><strong>ID:</strong> {session.user.id}</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {/* Portal de Apoderado - Para guardians */}
                {isGuardian() && (
                  <Link href="/apoderado" className="block border-2 border-green-300 rounded-lg p-4 hover:shadow-md transition-shadow bg-green-50 cursor-pointer">
                    <h4 className="font-semibold mb-2">📋 Portal de Apoderado</h4>
                    <p className="text-sm text-gray-600">Gestionar solicitudes de admisión de tus representados</p>
                  </Link>
                )}

                {/* Administración - Para admins */}
                {hasAdminAccess() && (
                  <Link href="/admin/users" className="block border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <h4 className="font-semibold mb-2">👥 Usuarios</h4>
                    <p className="text-sm text-gray-600">Gestión de usuarios del sistema</p>
                  </Link>
                )}

                {hasAdminAccess() && (
                  <Link href="/admin/admisiones" className="block border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <h4 className="font-semibold mb-2">📝 Admisiones</h4>
                    <p className="text-sm text-gray-600">Gestionar solicitudes de admisión</p>
                  </Link>
                )}

                {hasAdminAccess() && (
                  <Link href="/admin" className="block border rounded-lg p-4 hover:shadow-md transition-shadow bg-blue-50 cursor-pointer">
                    <h4 className="font-semibold mb-2">⚙️ Administración</h4>
                    <p className="text-sm text-gray-600">Panel de administración</p>
                  </Link>
                )}

                {/* Secretaria - Solicitudes recibidas */}
                {isSecretary() && (
                  <Link href="/admin/admisiones" className="block border-2 border-blue-300 rounded-lg p-4 hover:shadow-md transition-shadow bg-blue-50 cursor-pointer">
                    <h4 className="font-semibold mb-2">📥 Solicitudes Recibidas</h4>
                    <p className="text-sm text-gray-600">Revisar y gestionar nuevas solicitudes</p>
                  </Link>
                )}

                {/* Directivo - Solicitudes asignadas */}
                {isDirectivo() && (
                  <Link href="/admin/admisiones/asignadas" className="block border-2 border-purple-300 rounded-lg p-4 hover:shadow-md transition-shadow bg-purple-50 cursor-pointer">
                    <h4 className="font-semibold mb-2">📋 Mis Asignaciones</h4>
                    <p className="text-sm text-gray-600">Ver solicitudes asignadas para revisión</p>
                  </Link>
                )}
              </div>

              {/* Mensaje informativo si no tiene acceso a nada especial */}
              {!hasAdminAccess() && !isGuardian() && !isDirectivo() && !isSecretary() && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    ℹ️ Tu cuenta está activa pero no tienes roles asignados. Contacta al administrador.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

