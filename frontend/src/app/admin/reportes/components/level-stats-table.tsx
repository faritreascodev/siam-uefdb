import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface LevelStatsProps {
  data: any[]
}

export function LevelStatsTable({ data }: LevelStatsProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nivel Educativo</TableHead>
            <TableHead>Jornada</TableHead>
            <TableHead>Especialidad</TableHead>
            <TableHead className="text-center">Total Solicitudes</TableHead>
            <TableHead className="text-center">Aprobadas</TableHead>
            <TableHead className="text-center">Rechazadas</TableHead>
            <TableHead className="text-center bg-gray-50">Cupos Ocupados</TableHead>
            <TableHead className="text-center bg-gray-50">Disponibles</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
             <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No hay datos disponibles.
                </TableCell>
              </TableRow>
          ) : (
            data.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{item.level}</TableCell>
                <TableCell>{item.shift}</TableCell>
                <TableCell>{item.specialty || "-"}</TableCell>
                <TableCell className="text-center">{item.totalApplications}</TableCell>
                <TableCell className="text-center text-green-600 font-bold">{item.approved}</TableCell>
                <TableCell className="text-center text-red-600">{item.rejected}</TableCell>
                
                {/* Stats de Cupos */}
                <TableCell className="text-center bg-gray-50 font-semibold">{item.occupied}</TableCell>
                <TableCell className="text-center bg-gray-50">
                  <Badge variant={item.available > 0 ? "default" : "destructive"}>
                    {item.available} / {item.totalQuota}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
