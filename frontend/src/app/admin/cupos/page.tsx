"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./components/columns"
import { QuotaDialog } from "./components/quota-dialog"
import { quotasApi } from "@/lib/api-quotas"
import { AdmissionQuota } from "@/types/quota"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../components/ui/alert-dialog"

export default function QuotasPage() {
  const { data: session } = useSession()
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;

  const [data, setData] = useState<AdmissionQuota[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedQuota, setSelectedQuota] = useState<AdmissionQuota | null>(null)
  
  // Delete confirmation
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [quotaToDelete, setQuotaToDelete] = useState<AdmissionQuota | null>(null)

  const loadData = async () => {
    if (!token) return;
    try {
      setLoading(true)
      const quotas = await quotasApi.getAll(token)
      setData(quotas)
    } catch (error) {
      console.error(error)
      toast.error("Error al cargar cupos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) loadData()
  }, [token])

  const handleCreate = () => {
    setSelectedQuota(null)
    setDialogOpen(true)
  }

  const handleEdit = (quota: AdmissionQuota) => {
    setSelectedQuota(quota)
    setDialogOpen(true)
  }

  const handleDeleteClick = (quota: AdmissionQuota) => {
    setQuotaToDelete(quota)
    setDeleteOpen(true)
  }

  const msgConfirmDelete = async () => {
    if (!quotaToDelete || !token) return
    try {
      await quotasApi.delete(token, quotaToDelete.id)
      toast.success("Cupo eliminado")
      loadData()
    } catch (error) {
      toast.error("Error al eliminar")
    } finally {
      setDeleteOpen(false)
      setQuotaToDelete(null)
    }
  }
  
  const handleSeed = async () => {
    if (!token) return;
    try {
      setLoading(true);
      await quotasApi.seed(token);
      toast.success("Datos iniciales 2026-2027 cargados correctamente");
      loadData();
    } catch (error) {
      toast.error("Error al ejecutar seed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold tracking-tight">Gestión de Cupos</h2>
           <p className="text-muted-foreground">
             Configure la disponibilidad de cupos por nivel, paralelo y jornada para el año lectivo 2026-2027.
           </p>
        </div>
        <div className="flex gap-2">
           {data.length === 0 && (
             <Button variant="secondary" onClick={handleSeed}>
               Cargar Iniciales 2027
             </Button>
           )}
           <Button onClick={handleCreate}>
             <Plus className="mr-2 h-4 w-4" /> Nuevo Cupo
           </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">Cargando...</div>
      ) : (
        <DataTable 
          columns={columns({ onEdit: handleEdit, onDelete: handleDeleteClick })} 
          data={data} 
          searchKey="level"
        />
      )}

      <QuotaDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        quotaToEdit={selectedQuota}
        onSuccess={loadData}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la configuración de cupo para {quotaToDelete?.level} {quotaToDelete?.parallel}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={msgConfirmDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
