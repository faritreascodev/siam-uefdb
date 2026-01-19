"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { getAllApplications } from "@/lib/api-admin-applications"
import { Application } from "@/types/application"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'Enviada',
  UNDER_REVIEW: 'En Revisión',
  APPROVED: 'Aprobada',
  PAYMENT_VALIDATED: 'Pago Validado',
  MATRICULATED: 'Matriculado',
  REJECTED: 'Rechazada',
  REQUIRES_CORRECTION: 'Requiere Corrección',
  DRAFT: 'Borrador'
}

export default function UnassignedReportPage() {
  const { data: session } = useSession()
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;

  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<Application[]>([])

  const fetchUnassigned = async () => {
    if (!token) return
    setLoading(true)
    try {
      // 1. Fetch APPROVED
      const approved = await getAllApplications(token, {
        status: 'APPROVED',
        assignedParallel: 'none',
        limit: 100 
      })

      // 2. Fetch PAYMENT_VALIDATED
      const validated = await getAllApplications(token, {
        status: 'PAYMENT_VALIDATED',
        assignedParallel: 'none',
        limit: 100
      })
      
      const all = [...approved.data, ...validated.data];

      // Sort by Date
      const sorted = all.sort((a, b) => {
        const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        return dateA - dateB;
      })
      
      setApplications(sorted)
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Error al cargar reporte")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) fetchUnassigned()
  }, [token])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-orange-700">Reporte: Estudiantes sin Asignar</h2>
          <p className="text-muted-foreground">
            Estudiantes aprobados pendientes de asignación de paralelo y matriculación
          </p>
        </div>
        <Button variant="outline" onClick={fetchUnassigned} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Actualizar'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Pendientes ({applications.length})</CardTitle>
          <CardDescription>
            Haga clic en "Gestionar" para asignar un paralelo y completar la matrícula.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cédula</TableHead>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Nivel / Especialidad</TableHead>
                  <TableHead>Estado Actual</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
                        <span className="ml-2">Cargando...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : applications.length > 0 ? (
                  applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell>{app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>{app.studentCedula}</TableCell>
                      <TableCell className="font-medium uppercase">
                        {app.studentLastName} {app.studentFirstName}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{app.gradeLevel}</div>
                        {app.specialty && <Badge variant="outline" className="text-xs">{app.specialty}</Badge>}
                      </TableCell>
                      <TableCell>
                         <Badge variant={app.status === 'APPROVED' ? 'default' : 'secondary'} className="bg-green-100 text-green-800 hover:bg-green-200">
                           {STATUS_LABELS[app.status] || app.status}
                         </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/admin/admisiones/${app.id}`}>
                            Gestionar <ArrowRight className="ml-2 h-3 w-3" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                            ¡Todo al día! No hay estudiantes pendientes de asignación.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
