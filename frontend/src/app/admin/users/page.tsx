"use client"

import { useEffect, useState, useMemo } from "react"
import { useSession } from "next-auth/react"
import { User } from "@/types/user"
import { getUsers } from "@/lib/api-users"
import { DataTable } from "@/components/ui/data-table"
import { getColumns } from "./columns"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { UserDialog } from "./user-dialog"
import { bulkApproveUsers, bulkRejectUsers } from "@/lib/api-users"
import { toast } from "sonner"
import { CheckCircle, XCircle } from "lucide-react"
import { getSystemConfigs } from "@/lib/api-config"
import { useRoles } from "@/hooks/use-roles"
import { useRouter } from "next/navigation"

export default function UsersPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { isSuperAdmin, isAdmin, isSecretaria } = useRoles()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const loadUsers = async () => {
    // @ts-expect-error - accessToken is added in next-auth callbacks
    const token = session?.accessToken || (session?.user as { accessToken?: string })?.accessToken

    if (!token) {
      // If no token immediately, maybe waiting for session to stabilize?
      // But if session is present and no token, we can't fetch.
      return
    }

    setLoading(true)
    setError(null)
    try {
      // Configuración de permisos para secretaría
      if (isSecretaria() && !isAdmin() && !isSuperAdmin()) {
        const configs = await getSystemConfigs(token)
        const canManage = configs.find((c: any) => c.key === 'SECRETARY_MANAGE_USERS')?.value === 'true'
        if (!canManage) {
          router.push('/admin/admisiones')
          return
        }
      }

      const data = await getUsers(token)
      setUsers(data)
    } catch (err) {
      setError("Failed to load users")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      loadUsers()
    }
  }, [session])

  const columns = useMemo(() => getColumns(loadUsers), [loadUsers])

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Agregar Usuario
        </Button>
      </div>

      <UserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={loadUsers}
      />

      {loading ? (
        <div className="flex justify-center p-8">Cargando usuarios...</div>
      ) : error ? (
        <div className="text-red-500 p-4">{error}</div>
      ) : (
        <DataTable
          columns={columns}
          data={users}
          searchKey="email"
          bulkActions={(table) => {
            const selectedRows = table.getFilteredSelectedRowModel().rows
            const selectedIds = selectedRows.map((row: any) => row.original.id)
            const hasPending = selectedRows.some((row: any) => row.original.status === 'PENDIENTE_APROBACION')

            const handleBulkApprove = async () => {
              // @ts-ignore
              const token = session?.accessToken || session?.user?.accessToken
              if (!token) return

              try {
                await bulkApproveUsers(token, selectedIds)
                toast.success(`${selectedIds.length} usuarios aprobados`)
                loadUsers()
                table.resetRowSelection()
              } catch (err: any) {
                toast.error(err.message)
              }
            }

            const handleBulkReject = async () => {
              // @ts-ignore
              const token = session?.accessToken || session?.user?.accessToken
              if (!token) return

              try {
                await bulkRejectUsers(token, selectedIds)
                toast.success(`${selectedIds.length} usuarios rechazados`)
                loadUsers()
                table.resetRowSelection()
              } catch (err: any) {
                toast.error(err.message)
              }
            }

            return (
              <div className="flex gap-2 items-center bg-slate-100 p-1 px-2 rounded-md border animate-in fade-in slide-in-from-left-2">
                <span className="text-xs font-medium mr-2">{selectedIds.length} seleccionados</span>
                {hasPending && (
                  <Button size="sm" variant="outline" className="h-8 text-green-600 border-green-200 hover:bg-green-50" onClick={handleBulkApprove}>
                    <CheckCircle className="h-3.5 w-3.5 mr-1" /> Aprobar
                  </Button>
                )}
                <Button size="sm" variant="outline" className="h-8 text-red-600 border-red-200 hover:bg-red-50" onClick={handleBulkReject}>
                  <XCircle className="h-3.5 w-3.5 mr-1" /> Rechazar
                </Button>
              </div>
            )
          }}
        />
      )}
    </div>
  )
}
