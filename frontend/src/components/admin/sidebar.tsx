"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { signOut } from "next-auth/react"
import { useRoles } from "@/hooks/use-roles"
import { Home, Users, Settings, LogOut, FileText } from "lucide-react"

// ... imports

export function AdminSidebar() {
  const pathname = usePathname()
  const { hasAdminAccess, isSecretary } = useRoles()

  const navItems = [
    {
      title: "Dashboard",
      href: "/admin",
      icon: Home,
      show: hasAdminAccess(),
    },
    {
      title: "Solicitudes",
      href: "/admin/admisiones",
      icon: FileText,
      show: hasAdminAccess() || isSecretary(),
    },
    {
      title: "Usuarios",
      href: "/admin/users",
      icon: Users,
      show: hasAdminAccess(),
    },
    {
      title: "Configuración",
      href: "/admin/settings",
      icon: Settings,
      show: hasAdminAccess(),
    },
  ]

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        <Link
          href={hasAdminAccess() ? "/admin" : "/admin/admisiones"}
          className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
        >
          <Home className="h-4 w-4 transition-all group-hover:scale-110" />
          <span className="sr-only">Admin Dashboard</span>
        </Link>

        <TooltipProvider>
          {navItems.filter(item => item.show).map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
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


      <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
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
