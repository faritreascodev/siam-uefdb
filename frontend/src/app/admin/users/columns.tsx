"use client"

import { ColumnDef } from "@tanstack/react-table"
import { User } from "@/types/user"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { UserActions } from "./user-actions"
import { Checkbox } from "@/components/ui/checkbox"

export function getColumns(onSuccess: () => void): ColumnDef<User>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value: any) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value: any) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "email",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Email
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    },
    {
      accessorKey: "firstName",
      header: "Nombre",
    },
    {
      accessorKey: "lastName",
      header: "Apellido",
    },
    {
      accessorKey: "cedula",
      header: "Cédula",
    },
    {
      accessorKey: "roles",
      header: "Roles",
      cell: ({ row }) => {
        const roles = row.getValue("roles") as string[]
        return (
          <div className="flex gap-1 flex-wrap">
            {roles.map(role => (
              <Badge key={role} variant="outline" className="text-xs">{role}</Badge>
            ))}
          </div>
        )
      }
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        const colors: Record<string, string> = {
          'ACTIVO': 'bg-green-100 text-green-700 border-green-200',
          'PENDIENTE_APROBACION': 'bg-amber-100 text-amber-700 border-amber-200',
          'BLOQUEADO': 'bg-red-100 text-red-700 border-red-200',
          'RECHAZADO': 'bg-slate-100 text-slate-700 border-slate-200',
        }
        const labels: Record<string, string> = {
          'ACTIVO': 'Activo',
          'PENDIENTE_APROBACION': 'Pendiente',
          'BLOQUEADO': 'Bloqueado',
          'RECHAZADO': 'Rechazado',
        }
        return (
          <Badge variant="outline" className={colors[status] || ''}>
            {labels[status] || status}
          </Badge>
        )
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original
        return <UserActions user={user} onSuccess={onSuccess} />
      },
    },
  ]
}
