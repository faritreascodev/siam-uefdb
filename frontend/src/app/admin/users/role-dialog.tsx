"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { User, Role } from "@/types/user"
import { getRoles, assignRole, removeRole } from "@/lib/api-users"
import { useSession } from "next-auth/react"
import { Trash } from "lucide-react"
import { toast } from "sonner"

interface RoleDialogProps {
  user: User
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function RoleDialog({ user, open, onOpenChange, onSuccess }: RoleDialogProps) {
  const { data: session } = useSession()
  const [allRoles, setAllRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedRoleId, setSelectedRoleId] = useState<string>("")

  useEffect(() => {
    async function loadRoles() {
        // @ts-ignore
        const token = session?.accessToken || session?.user?.accessToken
        if (!token) return
        try {
            const roles = await getRoles(token)
            setAllRoles(roles)
        } catch (e) {
            console.error(e)
        }
    }
    if (open) {
        loadRoles()
    }
  }, [open, session])

// removed misplaced import

// ... inside RoleDialog

  async function handleAddRole() {
    if (!selectedRoleId) return
    setLoading(true)
    // @ts-ignore
    const token = session?.accessToken || session?.user?.accessToken
    try {
        await assignRole(token, user.id, selectedRoleId)
        toast.success("Rol asignado exitosamente")
        onSuccess()
    } catch (e) {
        console.error(e)
        toast.error("Error al asignar rol")
    } finally {
        setLoading(false)
        setSelectedRoleId("")
    }
  }

  async function handleRemoveRole(roleName: string) {
    // ... logic to find role
    const role = allRoles.find(r => r.name === roleName)
    if (!role) return 

    setLoading(true)
    // @ts-ignore
    const token = session?.accessToken || session?.user?.accessToken
    try {
         await removeRole(token, user.id, role.id)
         toast.success("Rol removido exitosamente")
         onSuccess()
    } catch (e) {
        console.error(e)
        toast.error("Error al remover rol")
    } finally {
        setLoading(false)
    }
  }

  const availableRoles = allRoles.filter(
    role => !user.roles.includes(role.name)
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manage Roles</DialogTitle>
          <DialogDescription>
            Assign or remove roles for {user.email}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
            <div className="flex flex-wrap gap-2">
                {user.roles.map(role => (
                    <Badge key={role} variant="secondary" className="flex items-center gap-1">
                        {role}
                        <Trash 
                            className="h-3 w-3 cursor-pointer text-red-500 hover:text-red-700" 
                            onClick={() => handleRemoveRole(role)}
                        />
                    </Badge>
                ))}
            </div>

            <div className="flex gap-2">
                <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select role to add" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableRoles.map(role => (
                            <SelectItem key={role.id} value={role.id}>
                                {role.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button onClick={handleAddRole} disabled={loading || !selectedRoleId}>
                    Add
                </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
