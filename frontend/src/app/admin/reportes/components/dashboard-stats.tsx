import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Clock, CheckCircle, XCircle, Percent } from "lucide-react"

interface DashboardStatsProps {
  stats: {
    totalApplications: number
    pendingReview: number
    approved: number
    rejected: number
    approvalRate: number
  }
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Solicitudes
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalApplications}</div>
          <p className="text-xs text-muted-foreground">
            Recibidas hasta la fecha
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Pendientes
          </CardTitle>
          <Clock className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingReview}</div>
          <p className="text-xs text-muted-foreground">
            En revisión o enviadas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Aprobadas
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.approved}</div>
          <p className="text-xs text-muted-foreground">
            Admitidos oficialmente
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Rechazadas
          </CardTitle>
          <XCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.rejected}</div>
          <p className="text-xs text-muted-foreground">
            No admitidos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Tasa Aprobación
          </CardTitle>
          <Percent className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.approvalRate}%</div>
          <p className="text-xs text-muted-foreground">
            Del total procesado
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
