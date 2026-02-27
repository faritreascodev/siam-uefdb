"use client"

import { ColumnDef } from "@tanstack/react-table"
import { User } from "@/types/user"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { UserActions } from "./user-actions"

export function getColumns(onSuccess: () => void): ColumnDef<User>[] {
  return [
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
      accessorKey: "isActive",
      header: "Estado",
      cell: ({ row }) => {
          const isActive = row.getValue("isActive") as boolean
          return (
              <Badge variant={isActive ? "default" : "destructive"}>
                  {isActive ? "Activo" : "Inactivo"}
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
