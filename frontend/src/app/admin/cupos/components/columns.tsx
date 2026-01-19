"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Pencil, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AdmissionQuota } from "@/types/quota"

export const columns = ({
  onEdit,
  onDelete
}: {
  onEdit: (quota: AdmissionQuota) => void
  onDelete: (quota: AdmissionQuota) => void
}): ColumnDef<AdmissionQuota>[] => [
  {
    accessorKey: "level",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nivel / Grado
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "parallel",
    header: "Paralelo",
  },
  {
    accessorKey: "shift",
    header: "Jornada",
  },
  {
    accessorKey: "specialty",
    header: "Especialidad",
    cell: ({ row }) => {
      const val = row.getValue("specialty") as string
      return val || "-"
    }
  },
  {
    accessorKey: "totalQuota",
    header: "Cupos Totales",
  },
  {
    accessorKey: "academicYear",
    header: "Año Lectivo",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const quota = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onEdit(quota)}>
              <Pencil className="mr-2 h-4 w-4" /> Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(quota)} className="text-red-600">
              <Trash className="mr-2 h-4 w-4" /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
