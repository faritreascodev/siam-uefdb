"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getAuditLogs } from "@/lib/api-audit"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { History, Search, Filter, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function AuditoriaPage() {
    const { data: session } = useSession()
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)

    // @ts-expect-error - accessToken is added in next-auth callbacks
    const token = session?.accessToken || (session?.user as { accessToken?: string })?.accessToken

    useEffect(() => {
        async function fetchLogs() {
            if (!token) return
            setLoading(true)
            try {
                const response = await getAuditLogs(token, { page, limit: 15 })
                setLogs(response.data)
                setTotal(response.total)
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
        fetchLogs()
    }, [token, page])

    const getActionBadge = (action: string) => {
        const actionStyles: Record<string, string> = {
            'APPROVE_APPLICATION': 'bg-green-100 text-green-700 border-green-200',
            'REJECT_APPLICATION': 'bg-red-100 text-red-700 border-red-200',
            'SUBMIT_APPLICATION': 'bg-blue-100 text-blue-700 border-blue-200',
            'REQUEST_CORRECTION': 'bg-amber-100 text-amber-700 border-amber-200',
            'ASSIGN_PARALLEL_MATRICULATE': 'bg-purple-100 text-purple-700 border-purple-200',
        }

        return (
            <Badge variant="outline" className={actionStyles[action] || 'bg-slate-100 text-slate-700'}>
                {action}
            </Badge>
        )
    }

    return (
        <div className="container mx-auto py-8 space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Bitácora de Auditoría</h1>
                    <p className="text-muted-foreground">Registro histórico de todas las acciones administrativas en el sistema.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-2" /> Filtrar
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-medium">Historial de Operaciones</CardTitle>
                        <div className="relative w-72">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Buscar por entidad o ID..." className="pl-9" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
                            <p>Cargando registros...</p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50">
                                        <TableHead className="w-[180px]">Fecha y Hora</TableHead>
                                        <TableHead>Acción</TableHead>
                                        <TableHead>Entidad</TableHead>
                                        <TableHead>ID Entidad</TableHead>
                                        <TableHead>Usuario</TableHead>
                                        <TableHead className="text-right">Detalles</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.length > 0 ? (
                                        logs.map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell className="font-medium text-xs">
                                                    {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: es })}
                                                </TableCell>
                                                <TableCell>{getActionBadge(log.action)}</TableCell>
                                                <TableCell className="text-sm font-medium">{log.entity}</TableCell>
                                                <TableCell className="text-xs font-mono text-muted-foreground">{log.entityId?.substring(0, 8)}...</TableCell>
                                                <TableCell className="text-sm font-medium">{log.userEmail || "Sistema"}</TableCell>
                                                <TableCell className="max-w-[200px]">
                                                    <div className="text-xs text-muted-foreground truncate" title={JSON.stringify(log.details)}>
                                                        {log.details && typeof log.details === 'object'
                                                            ? Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(', ')
                                                            : String(log.details || '-')
                                                        }
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                                No se encontraron registros de auditoría.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    <div className="flex items-center justify-end space-x-2 py-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(page - 1)}
                            disabled={page === 1}
                        >
                            Anterior
                        </Button>
                        <div className="text-sm font-medium">Página {page}</div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(page + 1)}
                            disabled={logs.length < 15}
                        >
                            Siguiente
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
