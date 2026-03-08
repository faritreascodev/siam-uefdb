"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { getSystemConfigs, updateSystemConfig } from "@/lib/api-config"
import { toast } from "sonner"
import { Settings, Save, Loader2, Calendar, Lock, Database, FileText, Plus, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

import { useRoles } from "@/hooks/use-roles"

export default function SettingsPage() {
    const { data: session } = useSession()
    const { isSuperAdmin } = useRoles()
    const [configs, setConfigs] = useState<{ key: string; value: string }[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)

    // @ts-expect-error - accessToken is added in next-auth callbacks
    const token = session?.accessToken || (session?.user as { accessToken?: string })?.accessToken

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

            setConfigs(configs.map(c => c.key === key ? { ...c, value } : c))
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Error desconocido";
            toast.error(message)
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
                {isSuperAdmin() && (
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
                )}

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

                {/* Documentos Requeridos */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 text-green-700 rounded-lg">
                                <Settings className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle>Documentos Requeridos</CardTitle>
                                <CardDescription>Habilita los documentos obligatorios que debe subir el usuario durante el formulario de admisión de acuerdo al grado.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {(() => {
                            const newDocsStr = getConfig('REQUIRED_DOCUMENTS_NEW')?.value;
                            const retDocsStr = getConfig('REQUIRED_DOCUMENTS_RETURNING')?.value;

                            const newDocs: string[] = newDocsStr ? JSON.parse(newDocsStr) : ['STUDENT_ID', 'REPRESENTATIVE_ID', 'STUDENT_PHOTO', 'GRADE_CERTIFICATE', 'UTILITY_BILL'];
                            const retDocs: string[] = retDocsStr ? JSON.parse(retDocsStr) : ['STUDENT_ID', 'REPRESENTATIVE_ID', 'STUDENT_PHOTO'];

                            const allOptions = [
                                { id: 'STUDENT_ID', label: 'Cédula del Estudiante' },
                                { id: 'REPRESENTATIVE_ID', label: 'Cédula del Representante' },
                                { id: 'STUDENT_PHOTO', label: 'Foto del Estudiante' },
                                { id: 'GRADE_CERTIFICATE', label: 'Certificado de Notas' },
                                { id: 'UTILITY_BILL', label: 'Planilla de Servicios Básicos' },
                            ];

                            const handleDocToggle = (type: 'NEW' | 'RETURNING', docId: string, checked: boolean) => {
                                let currentList = type === 'NEW' ? [...newDocs] : [...retDocs];
                                if (checked && !currentList.includes(docId)) currentList.push(docId);
                                if (!checked) currentList = currentList.filter(id => id !== docId);

                                handleUpdate(type === 'NEW' ? 'REQUIRED_DOCUMENTS_NEW' : 'REQUIRED_DOCUMENTS_RETURNING', JSON.stringify(currentList));
                            }

                            return (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-sm">Estudiantes Nuevos</h3>
                                        <div className="space-y-3">
                                            {allOptions.map(opt => (
                                                <div key={`new-${opt.id}`} className="flex items-center gap-2">
                                                    <Switch
                                                        id={`new-${opt.id}`}
                                                        checked={newDocs.includes(opt.id)}
                                                        onCheckedChange={(c) => handleDocToggle('NEW', opt.id, c)}
                                                    />
                                                    <Label htmlFor={`new-${opt.id}`} className="cursor-pointer font-normal">{opt.label}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-sm">Estudiantes Antiguos</h3>
                                        <div className="space-y-3">
                                            {allOptions.map(opt => (
                                                <div key={`ret-${opt.id}`} className="flex items-center gap-2">
                                                    <Switch
                                                        id={`ret-${opt.id}`}
                                                        checked={retDocs.includes(opt.id)}
                                                        onCheckedChange={(c) => handleDocToggle('RETURNING', opt.id, c)}
                                                    />
                                                    <Label htmlFor={`ret-${opt.id}`} className="cursor-pointer font-normal">{opt.label}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </CardContent>
                </Card>

                {/* Configurador de Formularios */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle>Constructor de Formularios</CardTitle>
                                <CardDescription>Habilita o deshabilita campos específicos dentro del formulario de admisión para adaptarlo a las necesidades de la institución.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {(() => {
                            const formConfigStr = getConfig('FORM_CONFIG')?.value;
                            const currentConfig = formConfigStr ? JSON.parse(formConfigStr) : {
                                fatherOccupation: true,
                                motherOccupation: true,
                                fatherCompany: true,
                                motherCompany: true,
                                showExtraContacts: true
                            };

                            const handleFormToggle = (key: string, checked: boolean) => {
                                const newConfig = { ...currentConfig, [key]: checked };
                                handleUpdate('FORM_CONFIG', JSON.stringify(newConfig));
                            }

                            return (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm">
                                        <Label className="cursor-pointer flex-1" htmlFor="fatherOccupation">Ocupación del Padre</Label>
                                        <Switch
                                            id="fatherOccupation"
                                            checked={!!currentConfig.fatherOccupation}
                                            onCheckedChange={(c) => handleFormToggle('fatherOccupation', c)}
                                            disabled={saving === 'FORM_CONFIG'}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm">
                                        <Label className="cursor-pointer flex-1" htmlFor="motherOccupation">Ocupación de la Madre</Label>
                                        <Switch
                                            id="motherOccupation"
                                            checked={!!currentConfig.motherOccupation}
                                            onCheckedChange={(c) => handleFormToggle('motherOccupation', c)}
                                            disabled={saving === 'FORM_CONFIG'}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm">
                                        <Label className="cursor-pointer flex-1" htmlFor="fatherCompany">Empresa del Padre</Label>
                                        <Switch
                                            id="fatherCompany"
                                            checked={!!currentConfig.fatherCompany}
                                            onCheckedChange={(c) => handleFormToggle('fatherCompany', c)}
                                            disabled={saving === 'FORM_CONFIG'}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm">
                                        <Label className="cursor-pointer flex-1" htmlFor="motherCompany">Empresa de la Madre</Label>
                                        <Switch
                                            id="motherCompany"
                                            checked={!!currentConfig.motherCompany}
                                            onCheckedChange={(c) => handleFormToggle('motherCompany', c)}
                                            disabled={saving === 'FORM_CONFIG'}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm">
                                        <Label className="cursor-pointer flex-1" htmlFor="showExtraContacts">Módulo de Contactos Extra</Label>
                                        <Switch
                                            id="showExtraContacts"
                                            checked={!!currentConfig.showExtraContacts}
                                            onCheckedChange={(c) => handleFormToggle('showExtraContacts', c)}
                                            disabled={saving === 'FORM_CONFIG'}
                                        />
                                    </div>
                                </div>
                            );
                        })()}
                    </CardContent>
                </Card>

                {/* GRADOS DISPONIBLES */}
                {isSuperAdmin() && <GradesConfigCard configStr={getConfig('FORM_GRADES')?.value} handleUpdate={handleUpdate} saving={saving} />}

                {/* ESPECIALIDADES BGU */}
                {isSuperAdmin() && <SpecialtiesConfigCard configStr={getConfig('FORM_SPECIALTIES')?.value} handleUpdate={handleUpdate} saving={saving} />}

                {/* PARENTESCOS */}
                {isSuperAdmin() && <RelationshipsConfigCard configStr={getConfig('FORM_RELATIONSHIPS')?.value} handleUpdate={handleUpdate} saving={saving} />}

                {isSuperAdmin() && (
                    <Card className="border-red-200">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 text-red-700 rounded-lg">
                                    <Database className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-red-700">Volcado de Datos (Fin de Año)</CardTitle>
                                    <CardDescription>Consolida el estado de los estudiantes matriculados y los prepara para el siguiente año lectivo, liberando cupos.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                <strong>Atención:</strong> Esta acción busca todas las solicitudes con estado de &quot;Matriculado&quot; y genera un registro académico automatizado para que el estudiante conste como antiguo el siguiente año lectivo, agilizando su proceso de actualización de datos.
                            </p>
                            <Button
                                variant="destructive"
                                onClick={async () => {
                                    if (confirm("¿Estás seguro de ejecutar el volcado de datos? Esta acción no se puede deshacer fácilmente.")) {
                                        try {
                                            setSaving('rollover');
                                            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/applications/admin/bulk/rollover`, {
                                                method: 'POST',
                                                headers: {
                                                    'Authorization': `Bearer ${token}`
                                                }
                                            });
                                            const d = await res.json();
                                            if (!res.ok) throw new Error(d.message || "Error al realizar el volcado");
                                            toast.success(d.message);
                                        } catch (e: unknown) {
                                            const message = e instanceof Error ? e.message : "Error al realizar el volcado";
                                            toast.error(message);
                                        } finally {
                                            setSaving(null);
                                        }
                                    }
                                }}
                                disabled={saving === 'rollover'}
                            >
                                {saving === 'rollover' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Database className="h-4 w-4 mr-2" />}
                                Ejecutar Volcado de Fin de Año
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}

function GradesConfigCard({ configStr, handleUpdate, saving }: { configStr?: string, handleUpdate: (key: string, val: string) => Promise<void>, saving: string | null }) {
    const defaultGrades = [
        { value: "Inicial 1", label: "Inicial 1", isBGU: false, requiresCursillo: false }
    ];
    const [grades, setGrades] = useState<{ value: string; label: string; isBGU: boolean; requiresCursillo: boolean }[]>(configStr ? JSON.parse(configStr) : defaultGrades);

    useEffect(() => {
        if (configStr) setGrades(JSON.parse(configStr));
    }, [configStr]);

    const addGrade = () => setGrades([...grades, { value: "", label: "", isBGU: false, requiresCursillo: false }]);
    const removeGrade = (index: number) => {
        const newG = [...grades];
        newG.splice(index, 1);
        setGrades(newG);
    };
    const updateGrade = (index: number, field: string, val: string | boolean) => {
        const newG = [...grades];
        (newG[index] as Record<string, string | boolean>)[field] = val;
        setGrades(newG);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 text-orange-700 rounded-lg">
                        <FileText className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle>Grados Disponibles</CardTitle>
                        <CardDescription>Gestiona los grados escolares que aparecen en el formulario de inscripción.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-4">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-2 font-medium">Valor (Interno) *</th>
                                    <th className="text-left p-2 font-medium">Etiqueta (Público) *</th>
                                    <th className="text-center p-2 font-medium">Es BGU</th>
                                    <th className="text-center p-2 font-medium">Requiere Cursillo</th>
                                    <th className="text-center p-2"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {grades.map((g, i) => (
                                    <tr key={i} className="border-b">
                                        <td className="p-2">
                                            <Input value={g.value} onChange={(e) => updateGrade(i, 'value', e.target.value)} placeholder="Ej: 1ero BGU" />
                                        </td>
                                        <td className="p-2">
                                            <Input value={g.label} onChange={(e) => updateGrade(i, 'label', e.target.value)} placeholder="Ej: 1er Bach." />
                                        </td>
                                        <td className="p-2 text-center">
                                            <Switch checked={g.isBGU} onCheckedChange={(c) => updateGrade(i, 'isBGU', c)} />
                                        </td>
                                        <td className="p-2 text-center">
                                            <Switch checked={g.requiresCursillo} onCheckedChange={(c) => updateGrade(i, 'requiresCursillo', c)} />
                                        </td>
                                        <td className="p-2 text-center">
                                            <Button variant="ghost" size="icon" onClick={() => removeGrade(i)} className="text-red-500 hover:text-red-700">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-between items-center">
                        <Button variant="outline" size="sm" onClick={addGrade}>
                            <Plus className="h-4 w-4 mr-2" /> Agregar Grado
                        </Button>
                        <Button
                            onClick={() => handleUpdate('FORM_GRADES', JSON.stringify(grades))}
                            disabled={saving === 'FORM_GRADES'}
                        >
                            {saving === 'FORM_GRADES' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Guardar Grados
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function SpecialtiesConfigCard({ configStr, handleUpdate, saving }: { configStr?: string, handleUpdate: (key: string, val: string) => Promise<void>, saving: string | null }) {
    const defaultSpecs = [{ value: "CIENCIAS", label: "BGU Ciencias", afternoonOnly: false }];
    const [specs, setSpecs] = useState<{ value: string; label: string; afternoonOnly: boolean }[]>(configStr ? JSON.parse(configStr) : defaultSpecs);

    useEffect(() => {
        if (configStr) setSpecs(JSON.parse(configStr));
    }, [configStr]);

    const addSpec = () => setSpecs([...specs, { value: "", label: "", afternoonOnly: false }]);
    const removeSpec = (index: number) => {
        const newS = [...specs];
        newS.splice(index, 1);
        setSpecs(newS);
    };
    const updateSpec = (index: number, field: string, val: string | boolean) => {
        const newS = [...specs];
        (newS[index] as Record<string, string | boolean>)[field] = val;
        setSpecs(newS);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                        <FileText className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle>Especialidades BGU</CardTitle>
                        <CardDescription>Configura las especialidades disponibles para Bachillerato.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-4">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-2 font-medium">Valor (Interno) *</th>
                                    <th className="text-left p-2 font-medium">Etiqueta *</th>
                                    <th className="text-center p-2 font-medium">Vespertino o Dual</th>
                                    <th className="text-center p-2"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {specs.map((s, i) => (
                                    <tr key={i} className="border-b">
                                        <td className="p-2">
                                            <Input value={s.value} onChange={(e) => updateSpec(i, 'value', e.target.value)} placeholder="Ej: CIENCIAS" />
                                        </td>
                                        <td className="p-2">
                                            <Input value={s.label} onChange={(e) => updateSpec(i, 'label', e.target.value)} placeholder="Ej: Ciencias" />
                                        </td>
                                        <td className="p-2 text-center">
                                            <Switch checked={s.afternoonOnly} onCheckedChange={(c) => updateSpec(i, 'afternoonOnly', c)} />
                                        </td>
                                        <td className="p-2 text-center">
                                            <Button variant="ghost" size="icon" onClick={() => removeSpec(i)} className="text-red-500 hover:text-red-700">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-between items-center">
                        <Button variant="outline" size="sm" onClick={addSpec}>
                            <Plus className="h-4 w-4 mr-2" /> Agregar Especialidad
                        </Button>
                        <Button
                            onClick={() => handleUpdate('FORM_SPECIALTIES', JSON.stringify(specs))}
                            disabled={saving === 'FORM_SPECIALTIES'}
                        >
                            {saving === 'FORM_SPECIALTIES' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Guardar Especialidades
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function RelationshipsConfigCard({ configStr, handleUpdate, saving }: { configStr?: string, handleUpdate: (key: string, val: string) => Promise<void>, saving: string | null }) {
    const defaultRels = ["Padre", "Madre", "Abuelo/a", "Tío/a", "Tutor Legal", "Otro"];
    const [rels, setRels] = useState<string[]>(configStr ? JSON.parse(configStr) : defaultRels);

    useEffect(() => {
        if (configStr) setRels(JSON.parse(configStr));
    }, [configStr]);

    const addRel = () => setRels([...rels, ""]);
    const removeRel = (index: number) => {
        const newR = [...rels];
        newR.splice(index, 1);
        setRels(newR);
    };
    const updateRel = (index: number, val: string) => {
        const newR = [...rels];
        newR[index] = val;
        setRels(newR);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                        <FileText className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle>Parentescos</CardTitle>
                        <CardDescription>Opciones de relación familiar.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {rels.map((r, i) => (
                            <div key={i} className="flex gap-2 items-center">
                                <Input value={r} onChange={(e) => updateRel(i, e.target.value)} placeholder="Ej: Padrastro" />
                                <Button variant="ghost" size="icon" onClick={() => removeRel(i)} className="text-red-500 hover:text-red-700 shrink-0">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between items-center">
                        <Button variant="outline" size="sm" onClick={addRel}>
                            <Plus className="h-4 w-4 mr-2" /> Agregar Opcion
                        </Button>
                        <Button
                            onClick={() => handleUpdate('FORM_RELATIONSHIPS', JSON.stringify(rels.filter(r => r.trim() !== "")))}
                            disabled={saving === 'FORM_RELATIONSHIPS'}
                        >
                            {saving === 'FORM_RELATIONSHIPS' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Guardar Parentescos
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
