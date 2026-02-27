'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createApplication, updateApplication, submitApplication, getApplication } from '@/lib/api-applications';
import { Application } from '@/types/application';
import { FormStepper } from '@/components/form-stepper';
import { StudentDataForm } from './steps/student-data-form';
import { AcademicDataForm } from './steps/academic-data-form';
import { FamilyDataForm } from './steps/family-data-form';
import { DocumentsForm } from './steps/documents-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, ArrowRight, Save, Send, Loader2, AlertTriangle } from 'lucide-react';

const STEPS = [
  { id: 'student', title: 'Datos del Estudiante', description: 'Información personal y de contacto' },
  { id: 'academic', title: 'Datos Académicos', description: 'Información escolar y grado' },
  { id: 'family', title: 'Datos Familiares', description: 'Información de padres y representante' },
  { id: 'documents', title: 'Documentos', description: 'Carga de documentos requeridos' },
];

interface ApplicationFormProps {
  applicationId?: string; // Si existe, es edición
}

export function ApplicationForm({ applicationId }: ApplicationFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [application, setApplication] = useState<Application | null>(null);
  const [formData, setFormData] = useState<Partial<Application>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [acceptedIdeario, setAcceptedIdeario] = useState(false);
  
  // Flag para evitar doble ejecución en React StrictMode
  const isLoadingRef = useRef(false);

  // @ts-ignore
  const token = session?.accessToken || session?.user?.accessToken;

  // Cargar solicitud existente o reutilizar/crear borrador
  useEffect(() => {
    async function loadOrCreate() {
      // Evitar doble ejecución
      if (!token || isLoadingRef.current) return;
      isLoadingRef.current = true;

      setLoading(true);
      try {
        if (applicationId) {
          // Cargar solicitud existente
          const app = await getApplication(token, applicationId);
          setApplication(app);
          setFormData(app);
        } else {
          // Primero, buscar si existe un borrador vacío para reutilizar
          const { getMyApplications } = await import('@/lib/api-applications');
          const myApps = await getMyApplications(token);
          
          // Buscar borrador vacío (DRAFT sin nombre de estudiante)
          const emptyDraft = myApps.find(
            (app: Application) => 
              app.status === 'DRAFT' && 
              (!app.studentFirstName || app.studentFirstName.trim() === '') &&
              (!app.studentLastName || app.studentLastName.trim() === '')
          );

          if (emptyDraft) {
            // Reutilizar borrador vacío existente
            setApplication(emptyDraft);
            setFormData(emptyDraft);
            router.replace(`/apoderado/solicitudes/${emptyDraft.id}/editar`);
          } else {
            // No hay borrador vacío, crear nuevo
            const newApp = await createApplication(token);
            setApplication(newApp);
            setFormData(newApp);
            router.replace(`/apoderado/solicitudes/${newApp.id}/editar`);
          }
        }
      } catch (error: any) {
        toast.error(error.message || 'Error al cargar la solicitud');
        router.push('/apoderado');
        isLoadingRef.current = false; // Reset on error
      } finally {
        setLoading(false);
      }
    }

    loadOrCreate();
  }, [applicationId, token, router]);

  // Guardar al cambiar de paso (auto-save solo al cambiar paso)
  const handleStepChange = async (newStep: number) => {
    await handleSave(true); // Guardar silenciosamente antes de cambiar
    setCurrentStep(newStep);
  };

  // Guardar borrador
  const handleSave = useCallback(async (silent = false): Promise<{ success: boolean; error?: any }> => {
    if (!application || !token) return { success: false, error: new Error('No session') };

    setSaving(true);
    try {
      const updated = await updateApplication(token, application.id, formData);
      setApplication(updated);
      setLastSaved(new Date());
      if (!silent) {
        toast.success('Borrador guardado correctamente');
      }
      return { success: true };
    } catch (error: any) {
      console.error("Error saving draft:", error);
      if (!silent) {
        toast.error(error.message || 'Error al guardar');
      }
      return { success: false, error };
    } finally {
      setSaving(false);
    }
  }, [application, token, formData]);

  // Enviar solicitud (con confirmación)
  const handleSubmit = async () => {
    if (!application || !token) return;

    setShowConfirmDialog(false);
    
    // Guardar cambios pendientes
    // IMPORTANT: If save fails, do not proceed to submit
    const saveResult = await handleSave(true); // Call silent, but check result
    
    if (!saveResult.success) {
        toast.error(`No se pudieron guardar los cambios: ${saveResult.error?.message || 'Error desconocido'}. Por favor revisa los datos.`);
        return;
    }

    setLoading(true);
    try {
      await submitApplication(token, application.id);
      toast.success('¡Solicitud enviada correctamente!');
      // Redirigir a página de confirmación
      router.push(`/apoderado/solicitudes/${application.id}/confirmacion`);
    } catch (error: any) {
      toast.error(error.message || 'Error al enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  // Actualizar datos del formulario
  const updateFormData = (data: Partial<Application>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  if (loading && !application) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {applicationId ? 'Editar Solicitud' : 'Nueva Solicitud de Admisión'}
          </h1>
          {lastSaved && (
            <p className="text-sm text-muted-foreground">
              Último guardado: {lastSaved.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {saving && (
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Guardando...
            </span>
          )}
        </div>
      </div>

      {/* Stepper */}
      <FormStepper steps={STEPS} currentStep={currentStep} onStepClick={handleStepChange} />

      {/* Contenido del paso actual */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep].title}</CardTitle>
          <CardDescription>{STEPS[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 0 && (
            <StudentDataForm data={formData} onChange={updateFormData} />
          )}
          {currentStep === 1 && (
            <AcademicDataForm data={formData} onChange={updateFormData} />
          )}
          {currentStep === 2 && (
            <FamilyDataForm data={formData} onChange={updateFormData} />
          )}
          {currentStep === 3 && application && (
            <DocumentsForm applicationId={application.id} documents={application.documents || []} />
          )}
        </CardContent>
      </Card>

      {/* Navegación */}
      <div className="flex justify-between">
        <div>
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={() => handleStepChange(currentStep - 1)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={saving}
          >
            <Save className="mr-2 h-4 w-4" />
            Guardar Borrador
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button onClick={() => handleStepChange(currentStep + 1)}>
              Siguiente
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => setShowConfirmDialog(true)} disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Enviar Solicitud
            </Button>
          )}
        </div>
      </div>

      {/* Modal de Confirmación */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirmar Envío de Solicitud
            </DialogTitle>
            <DialogDescription>
              Una vez enviada la solicitud, no podrás modificarla hasta que sea revisada por la institución.
              Asegúrate de haber completado toda la información y cargado todos los documentos requeridos.
            </DialogDescription>
          </DialogHeader>
            <div className="bg-amber-50 p-3 rounded-lg text-sm text-amber-800">
            <p className="font-medium">Antes de continuar, verifica que:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Todos los datos del estudiante estén correctos</li>
              <li>Hayas seleccionado el grado y jornada correctos</li>
              <li>Los datos de los padres/representante estén completos</li>
              <li>Todos los documentos requeridos estén cargados</li>
            </ul>
          </div>

          <div className="flex items-center space-x-2 my-4 p-4 border rounded-lg bg-gray-50">
            <input
              type="checkbox"
              id="ideario"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              checked={acceptedIdeario}
              onChange={(e) => setAcceptedIdeario(e.target.checked)}
            />
            <label
              htmlFor="ideario"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              He leído y acepto el <a href="/ideario-institucional.pdf" target="_blank" rel="noopener noreferrer" className="text-primary underline">Ideario Institucional</a> y el Código de Convivencia.
            </label>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Revisar de nuevo
            </Button>
            <Button onClick={handleSubmit} disabled={loading || !acceptedIdeario}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Confirmar y Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
