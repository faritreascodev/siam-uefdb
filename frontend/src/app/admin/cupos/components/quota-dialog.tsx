"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Button } from "@/components/ui/button"
import { AdmissionQuota, CreateQuotaDto, UpdateQuotaDto } from "@/types/quota"
import { quotasApi } from "@/lib/api-quotas"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

const formSchema = z.object({
  level: z.string().min(1, "El nivel es requerido"),
  parallel: z.string().min(1, "El paralelo es requerido"),
  shift: z.string().min(1, "La jornada es requerida"),
  specialty: z.string().optional(),
  totalQuota: z.coerce.number().min(1, "Debe ser al menos 1 cupo"),
  academicYear: z.string().default("2026-2027"),
})

interface QuotaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quotaToEdit?: AdmissionQuota | null
  onSuccess: () => void
}

export function QuotaDialog({ open, onOpenChange, quotaToEdit, onSuccess }: QuotaDialogProps) {
  const { data: session } = useSession()
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;
  
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      level: "",
      parallel: "A",
      shift: "Matutina",
      specialty: "",
      totalQuota: 30,
      academicYear: "2026-2027",
    },
  })

  useEffect(() => {
    if (quotaToEdit) {
      form.reset({
        level: quotaToEdit.level,
        parallel: quotaToEdit.parallel,
        shift: quotaToEdit.shift,
        specialty: quotaToEdit.specialty || "none",
        totalQuota: quotaToEdit.totalQuota,
        academicYear: quotaToEdit.academicYear,
      })
    } else {
      form.reset({
        level: "",
        parallel: "A",
        shift: "Matutina",
        specialty: "none",
        totalQuota: 30,
        academicYear: "2026-2027",
      })
    }
  }, [quotaToEdit, open, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!token) return;
    try {
      setLoading(true)
      
      const specialtyValue = values.specialty === "none" ? undefined : values.specialty;

      if (quotaToEdit) {
        const payload: UpdateQuotaDto = {
          ...values,
          specialty: specialtyValue
        };
        await quotasApi.update(token, quotaToEdit.id, payload)
        toast.success("Cupo actualizado correctamente")
      } else {
        const payload: CreateQuotaDto = {
          ...values,
          specialty: specialtyValue
        };
        await quotasApi.create(token, payload)
        toast.success("Configuración de cupo creada")
      }
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Error al guardar configuración")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{quotaToEdit ? "Editar Cupo" : "Nueva Configuración de Cupo"}</DialogTitle>
          <DialogDescription>
            Configure los cupos disponibles por nivel, paralelo y jornada.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Nivel */}
            <FormField
              control={form.control}
              name="level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nivel Educativo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un nivel" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Inicial 1 (3 años)">Inicial 1 (3 años)</SelectItem>
                      <SelectItem value="Inicial 2 (4 años)">Inicial 2 (4 años)</SelectItem>
                      <SelectItem value="1ero EGB">1ero EGB</SelectItem>
                      <SelectItem value="2do EGB">2do EGB</SelectItem>
                      <SelectItem value="3ero EGB">3ero EGB</SelectItem>
                      <SelectItem value="4to EGB">4to EGB</SelectItem>
                      <SelectItem value="5to EGB">5to EGB</SelectItem>
                      <SelectItem value="6to EGB">6to EGB</SelectItem>
                      <SelectItem value="7mo EGB">7mo EGB</SelectItem>
                      <SelectItem value="8vo EGB">8vo EGB</SelectItem>
                      <SelectItem value="9no EGB">9no EGB</SelectItem>
                      <SelectItem value="10mo EGB">10mo EGB</SelectItem>
                      <SelectItem value="1ero BGU">1ero BGU</SelectItem>
                      <SelectItem value="2do BGU">2do BGU</SelectItem>
                      <SelectItem value="3ero BGU">3ero BGU</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Paralelo */}
              <FormField
                control={form.control}
                name="parallel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paralelo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Único">Único</SelectItem>
                        <SelectItem value="A">A</SelectItem>
                        <SelectItem value="B">B</SelectItem>
                        <SelectItem value="C">C</SelectItem>
                        <SelectItem value="D">D</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Jornada */}
              <FormField
                control={form.control}
                name="shift"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jornada</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Matutina">Matutina</SelectItem>
                        <SelectItem value="Vespertina">Vespertina</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Especialidad (Opcional) */}
            <FormField
              control={form.control}
              name="specialty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Especialidad (Solo Bachillerato)</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Ninguna" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Ninguna</SelectItem>
                      <SelectItem value="Ciencias">Ciencias</SelectItem>
                      <SelectItem value="Técnico Informática">Técnico Informática</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cupos Totales */}
             <FormField
              control={form.control}
              name="totalQuota"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cupos Totales</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
