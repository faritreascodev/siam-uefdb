"use client"

import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { NotificationsDropdown } from "@/components/admin/notifications-dropdown"
import Link from "next/link"

interface BreadcrumbItem {
  label: string
  href: string
  isLast?: boolean
}

export function AdminHeader() {
  const pathname = usePathname()
  
  // Generate breadcrumbs from pathname
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const paths = pathname.split("/").filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = [{ label: "Inicio", href: "/dashboard" }]
    
    if (paths.length > 0 && paths[0] === "admin") {
      breadcrumbs.push({ label: "Admin", href: "/admin" })
      
      if (paths.length > 1) {
        const page = paths[1]
        const pageLabels: Record<string, string> = {
          users: "Gestión de Usuarios",
          settings: "Configuración",
        }
        breadcrumbs.push({ 
          label: pageLabels[page] || page, 
          href: `/admin/${page}`,
          isLast: true 
        })
      }
    }
    
    return breadcrumbs
  }
  
  const breadcrumbs = generateBreadcrumbs()

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="/admin"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              Usuarios
            </Link>
            <Link
              href="/admin/settings"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              Configuración
            </Link>
          </nav>
        </SheetContent>
      </Sheet>

      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.href} className="flex items-center">
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {crumb.isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      
      <div className="ml-auto flex items-center gap-2">
        <NotificationsDropdown />
      </div>
    </header>
  )
}
