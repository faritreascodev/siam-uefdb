"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRoles } from "@/hooks/use-roles";
import { useEffect, useState } from "react";
import { getGlobalStats } from "@/lib/api-applications";

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

  if (!stats) return <div className="p-4 mb-6 text-sm text-gray-500">Cargando estadísticas...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="text-sm text-gray-500">Total Solicitudes</div>
        <div className="text-2xl font-bold">{stats.total}</div>
      </div>
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="text-sm text-gray-500">Aprobadas</div>
        <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
      </div>
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="text-sm text-gray-500">Pendientes</div>
        <div className="text-2xl font-bold text-orange-600">
          {(stats.submitted || 0) + (stats.underReview || 0)}
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="text-sm text-gray-500">Borradores</div>
        <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { hasAdminAccess } = useRoles();

  useEffect(() => {
    // Only redirect after session is fully loaded and user doesn't have access
    if (status === "authenticated" && !hasAdminAccess()) {
      router.push("/dashboard");
    }
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, hasAdminAccess, router]);

  if (status === "loading") {
    return <div className="flex min-h-screen items-center justify-center">Cargando...</div>;
  }

  if (!session || !hasAdminAccess()) {
    return <div className="flex min-h-screen items-center justify-center">Verificando permisos...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold">Academic System - Admin</h1>
              <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
                ← Volver al Dashboard
              </Link>
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
            <div className="flex items-center gap-2 mb-6">
              <span className="text-3xl">⚙️</span>
              <h2 className="text-2xl font-bold">Panel de Administración</h2>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md mb-6">
              <p className="text-sm text-blue-800">
                ✅ <strong>Acceso Autorizado:</strong> Eres superadmin y tienes acceso completo al sistema.
              </p>
            </div>

            <DashboardStats />

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-purple-200 bg-purple-50 rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-2">👥 Gestión de Usuarios</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Crear, editar y eliminar usuarios del sistema
                  </p>
                  <Link href="/admin/users" className="inline-block px-4 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700">
                    Administrar Usuarios
                  </Link>
                </div>

                <div className="border border-green-200 bg-green-50 rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-2">🔐 Gestión de Roles</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Configurar roles y permisos del sistema
                  </p>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700">
                    Administrar Roles
                  </button>
                </div>

                <div className="border border-orange-200 bg-orange-50 rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-2">📊 Reportes</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Ver estadísticas y generar reportes
                  </p>
                  <Link href="/admin/reportes" className="inline-block px-4 py-2 bg-orange-600 text-white rounded-md text-sm hover:bg-orange-700">
                    Ver Reportes
                  </Link>
                </div>

                <div className="border border-red-200 bg-red-50 rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-2">⚙️ Configuración</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Ajustes generales del sistema
                  </p>
                  <Link href="/admin/cupos" className="inline-block px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700">
                    Gestionar Cupos
                  </Link>
                </div>
              </div>

              <div className="mt-8 p-4 bg-gray-100 rounded-md">
                <h3 className="font-semibold mb-2">Información del Sistema:</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li><strong>Versión:</strong> 1.0.0</li>
                  <li><strong>Backend API:</strong> http://localhost:4000</li>
                  <li><strong>Base de Datos:</strong> PostgreSQL</li>
                  <li><strong>Autenticación:</strong> NextAuth.js v5 + JWT</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
