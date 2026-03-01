"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Application, GRADE_LEVELS, STATUS_LABELS, STATUS_COLORS } from "@/types/application"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

export const columns: ColumnDef<Application>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected()}
                onCheckedChange={(value: boolean) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value: boolean) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "student",
        header: "Estudiante",
        cell: ({ row }) => {
            const app = row.original
            return (
                <div>
                    <div className="font-medium">{app.studentFirstName} {app.studentLastName}</div>
                    <div className="text-xs text-muted-foreground">{app.studentCedula}</div>
                </div>
            )
        }
    },
    {
        accessorKey: "gradeLevel",
        header: "Grado / Esp.",
        cell: ({ row }) => {
            const app = row.original
            const gradeLabel = GRADE_LEVELS.find(g => g.value === app.gradeLevel)?.label || app.gradeLevel
            return (
                <div className="flex flex-col">
                    <span className="text-sm">{gradeLabel}</span>
                    {app.specialty && <span className="text-xs text-muted-foreground">{app.specialty}</span>}
                </div>
            )
        }
    },
    {
        accessorKey: "submittedAt",
        header: "Fecha Envío",
        cell: ({ row }) => {
            const date = row.getValue("submittedAt") as string
            if (!date) return "-"
            return (
                <span className="text-sm">
                    {formatDistanceToNow(new Date(date), { addSuffix: true, locale: es })}
                </span>
            )
        }
    },
    {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => {
            const status = row.getValue("status") as keyof typeof STATUS_LABELS
            return (
                <Badge className={STATUS_COLORS[status]}>
                    {STATUS_LABELS[status]}
                </Badge>
            )
        }
    },
    {
        id: "actions",
        cell: ({ row }) => {
            return (
                <div className="text-right">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/admisiones/${row.original.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver
                        </Link>
                    </Button>
                </div>
            )
        },
    },
]
