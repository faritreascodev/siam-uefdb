"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { getAllApplications } from "@/lib/api-admin-applications"
import { Application, GRADE_LEVELS } from "@/types/application"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, FileDown, Users } from "lucide-react"
import { toast } from "sonner"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import * as XLSX from "xlsx"

const ALL_GRADES = [
  { value: "Inicial 1", label: "Inicial 1" },
  { value: "Inicial 2", label: "Inicial 2" },
  { value: "1ero EGB", label: "1ero EGB" },
  { value: "2do EGB", label: "2do EGB" },
  { value: "3ro EGB", label: "3ro EGB" },
  { value: "4to EGB", label: "4to EGB" },
  { value: "5to EGB", label: "5to EGB" },
  { value: "6to EGB", label: "6to EGB" },
  { value: "7mo EGB", label: "7mo EGB" },
  { value: "8vo EGB", label: "8vo EGB" },
  { value: "9no EGB", label: "9no EGB" },
  { value: "10mo EGB", label: "10mo EGB" },
  { value: "1ero BGU", label: "1° Bachillerato" },
  { value: "2do BGU", label: "2° Bachillerato" },
  { value: "3ro BGU", label: "3° Bachillerato" },
]

type ShiftType = '' | 'MORNING' | 'AFTERNOON' | 'all'

export default function NominaReportPage() {
  const { data: session } = useSession()
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken

  const [loading, setLoading] = useState(false)
  const [applications, setApplications] = useState<Application[]>([])

  // Filters
  const [gradeLevel, setGradeLevel] = useState<string>("")
  const [shift, setShift] = useState<ShiftType>("")
  const [specialty, setSpecialty] = useState<string>("")
  const [parallel, setParallel] = useState<string>("")

  const isBachillerato = ['1ero BGU', '2do BGU', '3ro BGU', '1ro_bachillerato', '2do_bachillerato', '3ro_bachillerato'].includes(gradeLevel)

  const fetchNomina = async () => {
    if (!token) return

    if (!gradeLevel) {
      toast.warning("Seleccione al menos el Nivel")
      return
    }

    setLoading(true)
    try {
      const response = await getAllApplications(token, {
        status: 'MATRICULATED',
        gradeLevel,
        shift: shift && shift !== 'all' ? shift : undefined,
        specialty: specialty && specialty !== 'all' ? specialty : undefined,
        assignedParallel: parallel && parallel !== 'all' ? parallel : undefined,
        limit: 500,
      })

      const sorted = response.data.sort((a, b) =>
        (a.studentLastName || '').localeCompare(b.studentLastName || '')
      )

      setApplications(sorted)

      if (sorted.length === 0) {
        toast.info("No se encontraron estudiantes matriculados con estos filtros")
      } else {
        toast.success(`${sorted.length} estudiantes encontrados`)
      }
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Error al cargar nómina")
    } finally {
      setLoading(false)
    }
  }

  const handleExportExcel = () => {
    if (applications.length === 0) {
      toast.warning("Primero genere la nómina")
      return
    }

    const selectedGrade = ALL_GRADES.find(g => g.value === gradeLevel)
    const shiftLabel = shift === 'MORNING' ? 'Matutina' : shift === 'AFTERNOON' ? 'Vespertina' : 'Todas'
    const specialtyLabel = specialty && specialty !== 'all' ? specialty : ''
    const parallelLabel = parallel && parallel !== 'all' ? parallel : ''

    const rows = applications.map((app, i) => ({
      '#': i + 1,
      'Cédula': app.studentCedula || '',
      'Apellidos': (app.studentLastName || '').toUpperCase(),
      'Nombres': (app.studentFirstName || '').toUpperCase(),
      'Género': app.studentGender === 'M' ? 'Masculino' : app.studentGender === 'F' ? 'Femenino' : app.studentGender === 'OTHER' ? 'Otro' : '',
      'Nivel': selectedGrade?.label || gradeLevel,
      'Jornada': app.shift === 'MORNING' ? 'Matutina' : 'Vespertina',
      'Especialidad': app.specialty || '',
      'Paralelo': app.assignedParallel || '',
      'Institución Anterior': app.previousSchool || '',
      'Promedio': app.lastYearAverage ? Number(app.lastYearAverage).toFixed(2) : '',
      'F. Matrícula': app.updatedAt ? new Date(app.updatedAt).toLocaleDateString('es-EC') : '',
    }))

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Nómina');

    // Anchos de columna
    ws['!cols'] = [
      { wch: 4 },  // #
      { wch: 13 }, // Cédula
      { wch: 24 }, // Apellidos
      { wch: 24 }, // Nombres
      { wch: 10 }, // Género
      { wch: 16 }, // Nivel
      { wch: 12 }, // Jornada
      { wch: 24 }, // Especialidad
      { wch: 10 }, // Paralelo
      { wch: 32 }, // Institución Anterior
      { wch: 10 }, // Promedio
      { wch: 14 }, // F. Matrícula
    ];

    // Altura de la fila de encabezado
    ws['!rows'] = [{ hpt: 20 }];

    const filename = [
      'Nomina',
      selectedGrade?.label?.replace(/ /g, '_') || gradeLevel,
      shiftLabel,
      specialtyLabel,
      parallelLabel,
      new Date().toISOString().split('T')[0]
    ].filter(Boolean).join('_') + '.xlsx'

    XLSX.writeFile(wb, filename)
    toast.success(`Exportado: ${filename} (${applications.length} estudiantes)`)
  }

  const gradeLabel = ALL_GRADES.find(g => g.value === gradeLevel)?.label || ''
  const shiftLabel = shift === 'MORNING' ? 'Matutina' : shift === 'AFTERNOON' ? 'Vespertina' : ''

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Nómina por Curso</h2>
          <p className="text-muted-foreground">
            Listado oficial de estudiantes matriculados · Año Lectivo 2026-2027
          </p>
        </div>
        <Button
          onClick={handleExportExcel}
          disabled={applications.length === 0}
          className="bg-green-600 hover:bg-green-700"
        >
          <FileDown className="mr-2 h-4 w-4" />
          Exportar Excel
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
          <CardDescription>Seleccione los parámetros para generar la nómina</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Nivel */}
            <div className="space-y-2">
              <Label>Nivel Educativo *</Label>
              <Select value={gradeLevel} onValueChange={v => { setGradeLevel(v); setSpecialty(''); setApplications([]) }}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar nivel" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_GRADES.map(g => (
                    <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Jornada */}
            <div className="space-y-2">
              <Label>Jornada</Label>
              <Select value={shift} onValueChange={v => setShift(v as ShiftType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="MORNING">Matutina</SelectItem>
                  <SelectItem value="AFTERNOON">Vespertina</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Especialidad - solo si es bachillerato */}
            {isBachillerato && (
              <div className="space-y-2">
                <Label>Especialidad</Label>
                <Select value={specialty} onValueChange={setSpecialty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="Ciencias">BGU Ciencias</SelectItem>
                    <SelectItem value="Técnico Informática">BT Informática</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Paralelo */}
            <div className="space-y-2">
              <Label>Paralelo</Label>
              <Select value={parallel} onValueChange={setParallel}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {['A', 'B', 'C', 'D', 'E', 'Único'].map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={fetchNomina} disabled={loading || !gradeLevel}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Generar Nómina
            </Button>
            {applications.length > 0 && (
              <Button variant="outline" onClick={handleExportExcel} className="border-green-300 text-green-700 hover:bg-green-50">
                <FileDown className="mr-2 h-4 w-4" />
                Exportar Excel ({applications.length} estudiantes)
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {applications.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {gradeLabel} {shiftLabel && `· ${shiftLabel}`}
                {specialty && specialty !== 'all' && ` · ${specialty === 'CIENCIAS' ? 'BGU Ciencias' : 'BT Informática'}`}
                {parallel && parallel !== 'all' && ` · Paralelo ${parallel}`}
              </CardTitle>
              <Badge variant="secondary" className="text-base px-3 py-1">
                {applications.length} estudiantes
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="border-t">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[50px] text-center">#</TableHead>
                    <TableHead>Cédula</TableHead>
                    <TableHead>Apellidos y Nombres</TableHead>
                    <TableHead className="text-center">Género</TableHead>
                    {isBachillerato && <TableHead>Especialidad</TableHead>}
                    <TableHead className="text-center">Paralelo</TableHead>
                    <TableHead>Jornada</TableHead>
                    <TableHead>Institución Ant.</TableHead>
                    <TableHead className="text-center">Promedio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app, index) => (
                    <TableRow key={app.id}>
                      <TableCell className="text-center text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-mono text-sm">{app.studentCedula || '—'}</TableCell>
                      <TableCell className="font-medium">
                        {app.studentLastName?.toUpperCase()} {app.studentFirstName?.toUpperCase()}
                      </TableCell>
                      <TableCell className="text-center">
                        {app.studentGender === 'M' ? '♂' : app.studentGender === 'F' ? '♀' : '○'}
                      </TableCell>
                      {isBachillerato && (
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {app.specialty === 'Ciencias' || app.specialty === 'CIENCIAS'
                              ? 'Ciencias'
                              : app.specialty === 'Técnico Informática' || app.specialty === 'TECNICO_INFORMATICA'
                                ? 'BT Inf.'
                                : app.specialty || '—'}
                          </Badge>
                        </TableCell>
                      )}
                      <TableCell className="text-center">
                        <Badge className="font-bold">{app.assignedParallel || '—'}</Badge>
                      </TableCell>
                      <TableCell>{app.shift === 'MORNING' ? 'Matutina' : app.shift === 'AFTERNOON' ? 'Vespertina' : '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">{app.previousSchool || '—'}</TableCell>
                      <TableCell className="text-center font-medium">
                        {app.lastYearAverage ? Number(app.lastYearAverage).toFixed(2) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && applications.length === 0 && gradeLevel && (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>No se encontraron estudiantes matriculados con los filtros seleccionados.</p>
        </div>
      )}
    </div>
  )
}
