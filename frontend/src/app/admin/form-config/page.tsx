"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Loader2, Plus, Pencil, Trash2, GripVertical, Settings2 } from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

interface FormFieldOption {
  value: string
  label: string
}

interface FormFieldConfig {
  id: string
  fieldKey: string
  fieldType: string
  label: string
  section: string
  options: FormFieldOption[] | null
  isRequired: boolean
  isEnabled: boolean
  placeholder?: string
  helpText?: string
  displayOrder: number
  updatedAt: string
}

export default function FormConfigPage() {
  const { data: session } = useSession()
  const [fields, setFields] = useState<FormFieldConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingField, setEditingField] = useState<FormFieldConfig | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // @ts-expect-error - accessToken is added in next-auth callbacks
  const token = session?.accessToken || (session?.user as { accessToken?: string })?.accessToken

  useEffect(() => {
    if (token) {
      fetchFields()
    }
  }, [token])

  const fetchFields = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/form-config`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        // Parse JSON strings back to objects
        const parsed = data.map((field: any) => ({
          ...field,
          options: field.options ? JSON.parse(field.options) : null,
        }))
        setFields(parsed)
      }
    } catch (error) {
      console.error('Error fetching fields:', error)
      toast.error('Error al cargar configuración de formularios')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleEnabled = async (id: string, isEnabled: boolean) => {
    setSaving(true)
    try {
      const response = await fetch(`${API_URL}/form-config/${id}/toggle`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isEnabled }),
      })

      if (response.ok) {
        toast.success(`Campo ${isEnabled ? 'habilitado' : 'deshabilitado'}`)
        await fetchFields()
      } else {
        throw new Error('Error al actualizar')
      }
    } catch (error) {
      toast.error('Error al actualizar el campo')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateOptions = async (fieldKey: string, options: FormFieldOption[]) => {
    setSaving(true)
    try {
      const response = await fetch(`${API_URL}/form-config/key/${fieldKey}/options`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ options }),
      })

      if (response.ok) {
        toast.success('Opciones actualizadas correctamente')
        await fetchFields()
        setDialogOpen(false)
        setEditingField(null)
      } else {
        throw new Error('Error al actualizar opciones')
      }
    } catch (error) {
      toast.error('Error al actualizar opciones')
    } finally {
      setSaving(false)
    }
  }

  const fieldsBySection = fields.reduce((acc, field) => {
    if (!acc[field.section]) {
      acc[field.section] = []
    }
    acc[field.section].push(field)
    return acc
  }, {} as Record<string, FormFieldConfig[]>)

  const sectionLabels: Record<string, string> = {
    student: 'Datos del Estudiante',
    family: 'Datos Familiares',
    academic: 'Datos Académicos',
    health: 'Datos de Salud',
    documents: 'Documentos',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurador de Formularios</h1>
        <p className="text-muted-foreground">
          Gestione los campos del formulario de admisión de forma dinámica. Puede habilitar/deshabilitar campos y editar las opciones de listas desplegables.
        </p>
      </div>

      <Tabs defaultValue="student" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="student">Estudiante</TabsTrigger>
          <TabsTrigger value="family">Familia</TabsTrigger>
          <TabsTrigger value="academic">Académicos</TabsTrigger>
          <TabsTrigger value="health">Salud</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
        </TabsList>

        {Object.entries(sectionLabels).map(([section, label]) => (
          <TabsContent key={section} value={section} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5" />
                  {label}
                </CardTitle>
                <CardDescription>
                  Configure los campos que se mostrarán en esta sección del formulario
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {fieldsBySection[section]?.map((field) => (
                    <div key={field.id} className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Label className="text-base font-medium">{field.label}</Label>
                          <Badge variant={field.isEnabled ? "default" : "secondary"}>
                            {field.isEnabled ? 'Activo' : 'Inactivo'}
                          </Badge>
                          <Badge variant="outline">{field.fieldType}</Badge>
                          {field.isRequired && <Badge variant="destructive">Requerido</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Clave: <code className="bg-slate-100 px-1 rounded">{field.fieldKey}</code>
                        </p>
                        {field.helpText && (
                          <p className="text-xs text-muted-foreground italic">{field.helpText}</p>
                        )}
                        {field.options && field.options.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {field.options.map((opt, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {opt.label}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {field.fieldType === 'select' && field.options && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingField(field)
                              setDialogOpen(true)
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Editar Opciones
                          </Button>
                        )}
                        <Switch
                          checked={field.isEnabled}
                          onCheckedChange={(checked) => handleToggleEnabled(field.id, checked)}
                          disabled={saving}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Dialog para editar opciones */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Opciones: {editingField?.label}</DialogTitle>
          </DialogHeader>
          {editingField && (
            <OptionsEditor
              field={editingField}
              onSave={handleUpdateOptions}
              onCancel={() => setDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function OptionsEditor({
  field,
  onSave,
  onCancel,
}: {
  field: FormFieldConfig
  onSave: (fieldKey: string, options: FormFieldOption[]) => void
  onCancel: () => void
}) {
  const [options, setOptions] = useState<FormFieldOption[]>(field.options || [])
  const [newOption, setNewOption] = useState({ value: '', label: '' })

  const addOption = () => {
    if (newOption.value && newOption.label) {
      setOptions([...options, newOption])
      setNewOption({ value: '', label: '' })
    }
  }

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index))
  }

  const updateOption = (index: number, key: 'value' | 'label', value: string) => {
    const updated = [...options]
    updated[index][key] = value
    setOptions(updated)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Opciones Actuales</Label>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2 p-2 border rounded">
              <GripVertical className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Value"
                value={option.value}
                onChange={(e) => updateOption(index, 'value', e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="Label (Texto a mostrar)"
                value={option.label}
                onChange={(e) => updateOption(index, 'label', e.target.value)}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeOption(index)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-sm font-medium">Agregar Nueva Opción</Label>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Value (ej: 8vo_egb)"
            value={newOption.value}
            onChange={(e) => setNewOption({ ...newOption, value: e.target.value })}
            className="flex-1"
          />
          <Input
            placeholder="Label (ej: 8vo Año EGB)"
            value={newOption.label}
            onChange={(e) => setNewOption({ ...newOption, label: e.target.value })}
            className="flex-1"
          />
          <Button onClick={addOption} disabled={!newOption.value || !newOption.label}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={() => onSave(field.fieldKey, options)}>
          Guardar Cambios
        </Button>
      </DialogFooter>
    </div>
  )
}
