"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { User, CreateUserRequest, UpdateUserRequest, Role } from "@/types/user"
import { createUser, updateUser, getRoles } from "@/lib/api-users"
import { useSession } from "next-auth/react"

const userSchema = z.object({
  email: z.string().email(),
  cedula: z.string().min(10, "Min 10 characters").optional(),
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
  roleName: z.string().min(1, "Role is required"),
}).refine((data) => {
  if (data.password && data.password !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

interface UserDialogProps {
  user?: User
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  children?: React.ReactNode
}

export function UserDialog({ user, open, onOpenChange, onSuccess, children }: UserDialogProps) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: "",
      cedula: "",
      firstName: "",
      lastName: "",
      password: "",
      confirmPassword: "",
      roleName: "",
    },
  })

  // Load roles when dialog opens
  useEffect(() => {
    const fetchRoles = async () => {
      // @ts-ignore
      const token = session?.accessToken || session?.user?.accessToken
      if (token && open) {
        try {
          const data = await getRoles(token)
          setRoles(data)
        } catch (error) {
          console.error("Failed to fetch roles", error)
        }
      }
    }
    fetchRoles()
  }, [session, open])

  useEffect(() => {
    if (user) {
      form.reset({
        email: user.email,
        cedula: user.cedula || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        password: "",
        confirmPassword: "",
        roleName: user.roles && user.roles.length > 0 ? user.roles[0] : "",
      })
    } else {
      form.reset({
        email: "",
        cedula: "",
        firstName: "",
        lastName: "",
        password: "",
        confirmPassword: "",
        roleName: "",
      })
    }
  }, [user, form, open])

  async function onSubmit(values: z.infer<typeof userSchema>) {
    setLoading(true)
    // @ts-ignore
    const token = session?.accessToken || session?.user?.accessToken
    if (!token) return

    try {
      if (user) {
        // Edit mode
        const updateData: UpdateUserRequest = {
          email: values.email,
          cedula: values.cedula,
          firstName: values.firstName,
          lastName: values.lastName,
          ...(values.password ? { password: values.password } : {}),
        }
        
        await updateUser(token, user.id, updateData)
        toast.success("Usuario actualizado exitosamente")
      } else {
        // Create mode
        if (!values.password) {
            form.setError("password", { message: "La contraseña es requerida para nuevos usuarios" })
            setLoading(false)
            return
        }
        const createData: CreateUserRequest = {
          email: values.email,
          cedula: values.cedula,
          firstName: values.firstName,
          lastName: values.lastName,
          password: values.password,
          roleNames: [values.roleName],
        }
        await createUser(token, createData)
        toast.success("Usuario creado exitosamente")
      }
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Error al guardar usuario")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{user ? "Editar Usuario" : "Crear Nuevo Usuario"}</DialogTitle>
          <DialogDescription>
            {user ? "Actualiza los detalles del usuario aquí." : "Ingresa los detalles del nuevo usuario."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField
              control={form.control}
              name="cedula"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cédula</FormLabel>
                   <FormControl>
                    <Input placeholder="1700000000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Juan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apellido</FormLabel>
                  <FormControl>
                    <Input placeholder="Pérez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Role Selection */}
            <FormField
              control={form.control}
              name="roleName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    value={field.value}
                    disabled={!!user}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.name}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{user ? "New Password (Optional)" : "Password"}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="******"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="sr-only">Toggle password visibility</span>
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="******"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="sr-only">Toggle password visibility</span>
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
