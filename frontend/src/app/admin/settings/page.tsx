"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { getSystemConfigs, updateSystemConfig } from "@/lib/api-config"
import { toast } from "sonner"
import { Settings, Save, Loader2, Calendar, Lock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

export default function SettingsPage() {
    const { data: session } = useSession()
    const [configs, setConfigs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)

    // @ts-ignore
    const token = session?.accessToken || session?.user?.accessToken

    useEffect(() => {
        async function fetchConfigs() {
            if (!token) return
            setLoading(true)
            try {
                const data = await getSystemConfigs(token)
                setConfigs(data)
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
        fetchConfigs()
    }, [token])

    const handleUpdate = async (key: string, value: string) => {
        if (!token) return
        setSaving(key)
        try {
            await updateSystemConfig(token, key, value)
            toast.success("Configuración actualizada")

            // Update local state
            setConfigs(configs.map(c => c.key === key ? { ...c, value } : c))
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setSaving(null)
        }
    }

    const getConfig = (key: string) => configs.find(c => c.key === key)

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8 max-w-4xl space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Configuración del Sistema</h1>
                <p className="text-muted-foreground">Gestione las variables globales y el comportamiento del portal.</p>
            </div>

            <div className="grid gap-6">
                {/* Periodo Lectivo */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                                <Calendar className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle>Periodo Lectivo Activo</CardTitle>
                                <CardDescription>Define el año escolar para las nuevas solicitudes y cupos.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="flex-1 space-y-2">
                                <Label htmlFor="academic_year">Año Lectivo</Label>
                                <Input
                                    id="academic_year"
                                    defaultValue={getConfig('CURRENT_ACADEMIC_YEAR')?.value}
                                    placeholder="Ej: 2026-2027"
                                    className="max-w-xs"
                                />
                            </div>
                            <Button
                                className="mt-8"
                                onClick={() => {
                                    const input = document.getElementById('academic_year') as HTMLInputElement
                                    handleUpdate('CURRENT_ACADEMIC_YEAR', input.value)
                                }}
                                disabled={saving === 'CURRENT_ACADEMIC_YEAR'}
                            >
                                {saving === 'CURRENT_ACADEMIC_YEAR' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                Guardar
                            </Button>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50 border-t px-6 py-3">
                        <p className="text-xs text-muted-foreground italic">
                            * Cambiar esto afectará la generación de PDFs y la visualización en el dashboard.
                        </p>
                    </CardFooter>
                </Card>

                {/* Estado de Admisiones */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                                <Lock className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle>Portal de Admisiones</CardTitle>
                                <CardDescription>Habilita o deshabilita la creación de nuevas solicitudes por parte de apoderados.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Recepción de Solicitudes</Label>
                            <p className="text-sm text-muted-foreground">
                                {getConfig('ADMISSION_OPEN')?.value === 'true' ? 'Abierto - El publico puede registrarse y postular' : 'Cerrado - Solo lectura para apoderados'}
                            </p>
                        </div>
                        <Switch
                            checked={getConfig('ADMISSION_OPEN')?.value === 'true'}
                            onCheckedChange={(checked) => handleUpdate('ADMISSION_OPEN', checked.toString())}
                            disabled={saving === 'ADMISSION_OPEN'}
                        />
                    </CardContent>
                </Card>

                {/* Permisos de Secretaría */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                                <Lock className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle>Permisos de Secretaría</CardTitle>
                                <CardDescription>Gestiona los permisos y roles adicionales que pueden tener los usuarios con rol de secretaría.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Gestión de Usuarios</Label>
                            <p className="text-sm text-muted-foreground">
                                {getConfig('SECRETARY_MANAGE_USERS')?.value === 'true' ? 'Permitido - Secretarias pueden ver y editar usuarios' : 'Bloqueado - Solo administradores pueden gestionar usuarios'}
                            </p>
                        </div>
                        <Switch
                            checked={getConfig('SECRETARY_MANAGE_USERS')?.value === 'true'}
                            onCheckedChange={(checked) => handleUpdate('SECRETARY_MANAGE_USERS', checked.toString())}
                            disabled={saving === 'SECRETARY_MANAGE_USERS'}
                        />
                    </CardContent>
                </Card>

                {/* Modulos Secretaria */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                                <Settings className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle>Permisos por Módulo (Secretaría)</CardTitle>
                                <CardDescription>Habilita o deshabilita el acceso a módulos completos para el rol Secretaría. Aplica inmediatamente y protege tanto el menú como las URLs directas (Backend y Frontend).</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {(() => {
                            const configStr = getConfig('SECRETARY_MODULES')?.value;
                            const modules = configStr ? JSON.parse(configStr) : {
                                dashboard: true,
                                admisiones: true,
                                matriculacion: true,
                                cupos: true,
                                cursillos: true,
                                reportes: false,
                                usuarios: false,
                                configuracion: false,
                                auditoria: false
                            };

                            const handleModuleToggle = (mod: string, checked: boolean) => {
                                const newModules = { ...modules, [mod]: checked };
                                handleUpdate('SECRETARY_MODULES', JSON.stringify(newModules));
                            }

                            return (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries({
                                        dashboard: 'Dashboard (Inicio)',
                                        admisiones: 'Matriculación y Admisiones',
                                        matriculacion: 'Asignación de Paralelos y Cupos',
                                        cupos: 'Cupos (Configuración)',
                                        cursillos: 'Cursillos',
                                        reportes: 'Reportes y Estadísticas',
                                        usuarios: 'Gestión de Usuarios',
                                        configuracion: 'Configuración del Sistema',
                                        auditoria: 'Auditoría'
                                    }).map(([key, label]) => (
                                        <div key={key} className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm">
                                            <Label className="cursor-pointer flex-1" htmlFor={`mod-${key}`}>
                                                {label}
                                            </Label>
                                            <Switch
                                                id={`mod-${key}`}
                                                checked={!!modules[key]}
                                                onCheckedChange={(c) => handleModuleToggle(key, c)}
                                                disabled={saving === 'SECRETARY_MODULES'}
                                            />
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </CardContent>
                </Card>

                {/* Información Institucional (Placeholder for future expansion) */}
                <Card className="opacity-60 grayscale cursor-not-allowed">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Otros Ajustes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm">Configuraciones de servidor de correo, límites de carga de archivos y plantillas de notificación estarán disponibles próximamente.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
