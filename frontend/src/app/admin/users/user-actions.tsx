"use client"

import { toast } from "sonner"

import { useState } from "react"
import { User } from "@/types/user"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"
import { UserDialog } from "./user-dialog"
import { RoleDialog } from "./role-dialog"
import { toggleUserStatus } from "@/lib/api-users"
import { useSession } from "next-auth/react"

interface UserActionsProps {
  user: User
  onSuccess: () => void
}
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog" // Use the polyfill or real component
import { resetPassword } from "@/lib/api-users"

export function UserActions({ user, onSuccess }: UserActionsProps) {
  const { data: session } = useSession()
  const [editOpen, setEditOpen] = useState(false)
  const [roleOpen, setRoleOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [tempPassword, setTempPassword] = useState<string | null>(null)

  async function handleToggleStatus() {
    setLoading(true)
    // @ts-ignore
    const token = session?.accessToken || session?.user?.accessToken
    if (!token) return

    try {
      await toggleUserStatus(token, user.id, !user.isActive)
      const action = !user.isActive ? "activado" : "desactivado"
      toast.success(`Usuario ${action} exitosamente`)
      onSuccess()
    } catch (error) {
      console.error(error)
      toast.error("Error al actualizar el estado del usuario")
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword() {
    setLoading(true)
    // @ts-ignore
    const token = session?.accessToken || session?.user?.accessToken
    if (!token) return

    try {
        const result = await resetPassword(token, user.id)
        setTempPassword(result.tempPassword || null)
        toast.success("Contraseña reseteada exitosamente")
    } catch (error) {
        console.error(error)
        toast.error("Error al resetear contraseña")
        setResetDialogOpen(false) // Close if error, or keep open? Close for now.
    } finally {
        setLoading(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => {
              navigator.clipboard.writeText(user.id)
              toast.success("ID copiado al portapapeles")
            }}
          >
            Copy User ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            Edit User
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setRoleOpen(true)}>
            Manage Roles
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setResetDialogOpen(true)}>
            Reset Password
          </DropdownMenuItem>
          <DropdownMenuItem 
            className={user.isActive ? "text-red-600 focus:text-red-600" : "text-green-600 focus:text-green-600"}
            onClick={handleToggleStatus}
            disabled={loading}
          >
            {user.isActive ? "Deactivate" : "Activate"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <UserDialog 
        user={user} 
        open={editOpen} 
        onOpenChange={setEditOpen} 
        onSuccess={onSuccess} 
      />
      
      <RoleDialog 
        user={user} 
        open={roleOpen} 
        onOpenChange={setRoleOpen} 
        onSuccess={onSuccess} 
      />

      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restablecer Contraseña</AlertDialogTitle>
            <AlertDialogDescription>
              {tempPassword ? (
                 <div className="mt-4 p-4 bg-muted rounded-md text-center">
                    <p className="font-medium text-foreground">Nueva Contraseña Temporal:</p>
                    <p className="text-2xl font-bold tracking-widest my-2 select-all">{tempPassword}</p>
                    <p className="text-xs text-muted-foreground">Por favor comparte esto con el usuario inmediatamente.</p>
                 </div>
              ) : (
                "¿Estás seguro de que quieres restablecer la contraseña de este usuario? Se generará una contraseña temporal."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {!tempPassword && (
                <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            )}
            {tempPassword ? (
                <AlertDialogAction onClick={() => {
                    setResetDialogOpen(false)
                    setTempPassword(null)
                }}>Cerrar</AlertDialogAction>
            ) : (
                <AlertDialogAction onClick={handleResetPassword} disabled={loading}>
                    {loading ? "Restableciendo..." : "Confirmar Restablecimiento"}
                </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
