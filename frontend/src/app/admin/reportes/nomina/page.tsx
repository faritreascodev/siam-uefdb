"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { getAllApplications } from "@/lib/api-admin-applications"
import { Application } from "@/types/application"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Printer, Search } from "lucide-react"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function NominaReportPage() {
  const { data: session } = useSession()
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;

  const [loading, setLoading] = useState(false)
  const [applications, setApplications] = useState<Application[]>([])
  
  // Filters
  const [gradeLevel, setGradeLevel] = useState<string>("")
  const [shift, setShift] = useState<string>("")
  const [specialty, setSpecialty] = useState<string>("")
  const [parallel, setParallel] = useState<string>("")

  const fetchNomina = async () => {
    if (!token) return

    if (!gradeLevel || !shift) {
      toast.warning("Seleccione al menos Nivel y Jornada")
      return
    }

    setLoading(true)
    try {
      // Query for MATRICULATED students
      const response = await getAllApplications(token, {
        status: 'MATRICULATED',
        gradeLevel,
        shift,
        specialty: specialty !== 'all' ? specialty : undefined,
        assignedParallel: parallel !== 'all' ? parallel : undefined,
        limit: 100 // Get enough for a class list
      })
      
      // Sort alphabetically by Last Name
      const sorted = response.data.sort((a, b) => 
        (a.studentLastName || '').localeCompare(b.studentLastName || '')
      )
      
      setApplications(sorted)
      
      if (sorted.length === 0) {
        toast.info("No se encontraron estudiantes matriculados con estos filtros")
      }
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Error al cargar nómina")
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6 print:space-y-0">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reporte: Nómina por Curso</h2>
          <p className="text-muted-foreground">
            Listado oficial de estudiantes matriculados
          </p>
        </div>
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Imprimir
        </Button>
      </div>

      {/* Header for Print only */}
      <div className="hidden print:block text-center mb-6">
        <h1 className="text-xl font-bold uppercase">Unidad Educativa Don Bosco</h1>
        <h2 className="text-lg">Nómina de Estudiantes - Año Lectivo 2026-2027</h2>
        <div className="mt-2 text-sm flex justify-center gap-4">
          <span><strong>Nivel:</strong> {gradeLevel || 'Todos'}</span>
          <span><strong>Jornada:</strong> {shift === 'MORNING' ? 'Matutina' : shift === 'AFTERNOON' ? 'Vespertina' : 'Todas'}</span>
          {specialty && <span><strong>Especialidad:</strong> {specialty}</span>}
          {parallel && <span><strong>Paralelo:</strong> {parallel}</span>}
        </div>
      </div>

      {/* Filters Card */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
          <CardDescription>Seleccione los parámetros para generar la nómina</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Nivel Educativo</Label>
              <Select value={gradeLevel} onValueChange={setGradeLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar Nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8vo_basico">8vo EGB</SelectItem>
                  <SelectItem value="9no_basico">9no EGB</SelectItem>
                  <SelectItem value="10mo_basico">10mo EGB</SelectItem>
                  <SelectItem value="1ro_bachillerato">1ero Bachillerato</SelectItem>
                  <SelectItem value="2do_bachillerato">2do Bachillerato</SelectItem>
                  <SelectItem value="3ro_bachillerato">3er Bachillerato</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Jornada</Label>
              <Select value={shift} onValueChange={setShift}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar Jornada" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MORNING">Matutina</SelectItem>
                  <SelectItem value="AFTERNOON">Vespertina</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Especialidad</Label>
              <Select value={specialty} onValueChange={setSpecialty}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="CIENCIAS">BGU Ciencias</SelectItem>
                  <SelectItem value="TECNICO_INFORMATICA">BGU Técnico Informática</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Paralelo</Label>
              <Select value={parallel} onValueChange={setParallel}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                  <SelectItem value="D">D</SelectItem>
                  <SelectItem value="E">E</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button onClick={fetchNomina} disabled={loading} className="w-full md:w-auto">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Generar Nómina
          </Button>
        </CardContent>
      </Card>

      {/* Results Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead>Cédula</TableHead>
              <TableHead>Apellidos y Nombres</TableHead>
              <TableHead>Especialidad</TableHead>
              <TableHead>Paralelo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.length > 0 ? (
              applications.map((app, index) => (
                <TableRow key={app.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{app.studentCedula}</TableCell>
                  <TableCell className="font-medium uppercase">
                    {app.studentLastName} {app.studentFirstName}
                  </TableCell>
                  <TableCell>{app.specialty || '-'}</TableCell>
                  <TableCell className="text-center font-bold">{app.assignedParallel || '-'}</TableCell>
                </TableRow>
              ))
            ) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        {loading ? "Cargando..." : "No hay datos para mostrar"}
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Signature Section for Print */}
      <div className="hidden print:flex mt-20 justify-around">
        <div className="text-center border-t border-black w-64 pt-2">
          <p className="font-bold">Secretaría</p>
        </div>
        <div className="text-center border-t border-black w-64 pt-2">
          <p className="font-bold">Rectorado</p>
        </div>
      </div>
    </div>
  )
}
