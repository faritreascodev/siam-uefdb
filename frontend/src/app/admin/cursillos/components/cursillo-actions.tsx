"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Application } from "@/types/application";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { scheduleCursillo, recordCursilloResult } from "@/lib/api-applications";
import { Calendar, CheckCircle, XCircle } from "lucide-react";

interface CursilloActionsProps {
  application: Application;
  onSuccess: () => void;
}

export function CursilloActions({ application, onSuccess }: CursilloActionsProps) {
  const { data: session } = useSession();
  const [openSchedule, setOpenSchedule] = useState(false);
  const [openResult, setOpenResult] = useState(false);
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  // @ts-ignore
  const token = session?.accessToken || session?.user?.accessToken;

  const handleSchedule = async () => {
    if (!date) {
      toast.error("Por favor seleccione una fecha");
      return;
    }
    setLoading(true);
    try {
      await scheduleCursillo(token, application.id, date);
      toast.success("Cursillo programado exitosamente");
      setOpenSchedule(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Error al programar cursillo");
    } finally {
      setLoading(false);
    }
  };

  const handleResult = async (result: 'APPROVED' | 'REJECTED') => {
    setLoading(true);
    try {
      await recordCursilloResult(token, application.id, result, notes);
      toast.success(`Cursillo marcado como ${result === 'APPROVED' ? 'Aprobado' : 'Reprobado'}`);
      setOpenResult(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Error al registrar resultado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Programar Cursillo Button */}
      {(!application.cursilloScheduled || application.status === 'UNDER_REVIEW') && (
        <Dialog open={openSchedule} onOpenChange={setOpenSchedule}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-blue-600">
              <Calendar className="mr-2 h-4 w-4" />
              Programar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Programar Cursillo</DialogTitle>
              <DialogDescription>
                Se notificará al apoderado la fecha programada para el cursillo presencial de admisión.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="date">Fecha del Cursillo</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button disabled={loading} variant="outline" onClick={() => setOpenSchedule(false)}>
                Cancelar
              </Button>
              <Button disabled={loading || !date} onClick={handleSchedule}>
                {loading ? "Guardando..." : "Programar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Registrar Resultado Button */}
      {application.cursilloScheduled && ['CURSILLO_SCHEDULED', 'UNDER_REVIEW'].includes(application.status) && (
        <Dialog open={openResult} onOpenChange={setOpenResult}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-green-600">
              <CheckCircle className="mr-2 h-4 w-4" />
              Evaluar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Evaluar Cursillo</DialogTitle>
              <DialogDescription>
                Registre el resultado del cursillo para el aspirante. Esta acción avanzará o detendrá el proceso de admisión.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="notes">Observaciones (Opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Escriba detalles del rendimiento o motivo de la calificación..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button disabled={loading} variant="outline" onClick={() => setOpenResult(false)}>
                Cancelar
              </Button>
              <Button disabled={loading} variant="destructive" onClick={() => handleResult('REJECTED')}>
                <XCircle className="mr-2 h-4 w-4" /> Reprobar
              </Button>
              <Button disabled={loading} className="bg-green-600 hover:bg-green-700" onClick={() => handleResult('APPROVED')}>
                <CheckCircle className="mr-2 h-4 w-4" /> Aprobar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
