"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { signOut } from "next-auth/react"
import { useRoles } from "@/hooks/use-roles"
import {
  Home, Users, Settings, LogOut, FileText,
  Calendar, Monitor, History, GraduationCap, BarChart3,
} from "lucide-react"
import { useEffect, useState } from "react"
import { getSystemConfigs } from "@/lib/api-config"
import { useSession } from "next-auth/react"

export function AdminSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const {
    isFullAdmin,
    isAdmin,
    isSuperAdmin,
    isPrincipal,
    isSecretary,
    canManageUsers,
    canViewAudit,
    canAccessSettings,
  } = useRoles()

  // Secretary configurable modules (loaded from system config)
  const [secModules, setSecModules] = useState<Record<string, boolean>>({
    dashboard: true,
    admisiones: true,
    matriculacion: true,
    cupos: true,
    cursillos: true,
    reportes: false,
    usuarios: false,
    configuracion: false,
    auditoria: false,
  })

  useEffect(() => {
    const token = (session as any)?.accessToken || (session?.user as any)?.accessToken
    if (!token) return

    getSystemConfigs(token).then((configs: any[]) => {
      const confModules = configs.find((c) => c.key === "SECRETARY_MODULES")
      if (confModules?.value) {
        try {
          setSecModules(JSON.parse(confModules.value))
        } catch { }
      }
    })
  }, [session])

  const isSec = isSecretary()
  const isPrinc = isPrincipal()
  const fullAdmin = isFullAdmin()

  /**
   * Nav item visibility rules:
   *  superadmin / admin  → everything
   *  principal (rector)  → dashboard, admissions, cursillo, reports (read-only)
   *  secretary           → whatever is enabled in SECRETARY_MODULES config
   */
  const navItems = [
    {
      id: "dashboard",
      title: "Dashboard",
      href: "/admin",
      icon: Home,
      show: fullAdmin || isPrinc || (isSec && secModules.dashboard),
      exact: true,
    },
    {
      id: "admisiones",
      title: "Solicitudes",
      href: "/admin/admisiones",
      icon: FileText,
      show: fullAdmin || isPrinc || (isSec && secModules.admisiones),
    },
    {
      id: "cursillos",
      title: "Cursillos",
      href: "/admin/cursillos",
      icon: Calendar,
      show: fullAdmin || isPrinc || (isSec && secModules.cursillos),
    },
    {
      id: "cupos",
      title: "Monitor Cursos",
      href: "/admin/cursos",
      icon: Monitor,
      show: fullAdmin || (isSec && secModules.matriculacion),
    },
    {
      id: "reportes",
      title: "Reportes",
      href: "/admin/reportes",
      icon: BarChart3,
      // Principal can read reports; secretary only if enabled
      show: fullAdmin || isPrinc || (isSec && secModules.reportes),
    },
    {
      id: "usuarios",
      title: "Usuarios",
      href: "/admin/users",
      icon: Users,
      // Only admin+ can manage users; secretary only if configured
      show: canManageUsers() || (isSec && secModules.usuarios),
    },
    {
      id: "configuracion",
      title: "Configuración",
      href: "/admin/settings",
      icon: Settings,
      // Principal cannot configure; secretary only if enabled
      show: canAccessSettings() || (isSec && secModules.configuracion),
    },
    {
      id: "auditoria",
      title: "Auditoría",
      href: "/admin/auditoria",
      icon: History,
      show: canViewAudit() || (isSec && secModules.auditoria),
    },
  ]

  const visibleItems = navItems.filter((item) => item.show)

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        {/* Logo / home link */}
        <Link
          href={fullAdmin || isPrinc ? "/admin" : "/admin/admisiones"}
          className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
        >
          <GraduationCap className="h-4 w-4 transition-all group-hover:scale-110" />
          <span className="sr-only">SIAM — Panel Admin</span>
        </Link>

        <TooltipProvider>
          {visibleItems.map((item) => {
            const Icon = item.icon
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/")

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    id={`sidebar-${item.id}`}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:text-foreground md:h-8 md:w-8",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="sr-only">{item.title}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{item.title}</TooltipContent>
              </Tooltip>
            )
          })}
        </TooltipProvider>
      </nav>

      {/* Bottom — sign out */}
      <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                id="sidebar-logout"
                className="h-9 w-9 md:h-8 md:w-8"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Cerrar Sesión</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Cerrar Sesión</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </nav>
    </aside>
  )
}
