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

export default function UsersPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const loadUsers = async () => {
    // @ts-ignore
    const token = session?.accessToken || session?.user?.accessToken
    
    if (!token) {
        // If no token immediately, maybe waiting for session to stabilize?
        // But if session is present and no token, we can't fetch.
        return 
    }
    
    setLoading(true)
    setError(null)
    try {
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
        <DataTable columns={columns} data={users} />
      )}
    </div>
  )
}
