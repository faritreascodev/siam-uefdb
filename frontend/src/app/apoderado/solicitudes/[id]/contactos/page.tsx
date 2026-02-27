"use client";

import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { extraContactsApi, ExtraContact } from "@/lib/api-extra-contacts";
import { getApplication } from "@/lib/api-applications";
import { Application } from "@/types/application";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Users, Trash2, Edit2, ShieldAlert } from "lucide-react";

export default function ExtraContactsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = use(params);
  const applicationId = unwrappedParams.id;
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;

  const [application, setApplication] = useState<Application | null>(null);
  const [contacts, setContacts] = useState<ExtraContact[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ExtraContact | null>(null);
  const [formData, setFormData] = useState<Partial<ExtraContact>>({
    cedula: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    relationship: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (token && applicationId) {
      loadData();
    }
  }, [token, applicationId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [appData, contactsData] = await Promise.all([
        getApplication(token, applicationId),
        extraContactsApi.getByApplication(applicationId, token),
      ]);
      setApplication(appData);
      setContacts(contactsData);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const hasMaxContacts = contacts.length >= 3;

  const handleOpenNew = () => {
    setEditingContact(null);
    setFormData({
      cedula: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      relationship: "",
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (contact: ExtraContact) => {
    setEditingContact(contact);
    setFormData({ ...contact });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.cedula || !formData.firstName || !formData.lastName || !formData.phone || !formData.relationship) {
      toast.error("Por favor completa los campos obligatorios");
      return;
    }

    try {
      setSaving(true);
      
      if (editingContact && editingContact.id) {
        // Update
        const updated = await extraContactsApi.update(editingContact.id, formData, token);
        setContacts(contacts.map(c => c.id === updated.id ? updated : c));
        toast.success("Contacto actualizado");
      } else {
        // Create
        if (hasMaxContacts) {
          toast.error("Límite de 3 contactos adicionales alcanzado");
          return;
        }
        const created = await extraContactsApi.create(
          { ...formData, applicationId } as ExtraContact,
          token
        );
        setContacts([...contacts, created]);
        toast.success("Contacto agregado");
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Error al guardar el contacto");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    if (!confirm("¿Seguro que deseas eliminar este contacto?")) return;

    try {
      await extraContactsApi.remove(id, token);
      setContacts(contacts.filter(c => c.id !== id));
      toast.success("Contacto eliminado");
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar el contacto");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="text-muted-foreground animate-pulse">Cargando contactos...</span>
      </div>
    );
  }

  const studentName = application?.studentFirstName 
    ? `${application.studentFirstName} ${application.studentLastName}`
    : "Estudiante";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button and Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/apoderado">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Contactos Adicionales</h2>
          <p className="text-muted-foreground flex items-center gap-2">
            <Users className="h-4 w-4" />
            {studentName}
          </p>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-slate-50 border-slate-200 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1">
              <h3 className="font-medium text-slate-800 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-blue-500" />
                Contactos Autorizados / Emergencia
              </h3>
              <p className="text-sm text-slate-600 max-w-2xl">
                Agrega personas de confianza (familiares o amigos cercanos) que estén 
                autorizadas para retirar al estudiante o contactar en caso de emergencia, 
                adicionales a la madre, padre o representante legal.
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-500 mb-2">
                Registrados: <span className="font-bold text-slate-900">{contacts.length} / 3</span>
              </div>
              <Button 
                onClick={handleOpenNew} 
                disabled={hasMaxContacts}
                className="w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Contacto
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contacts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contacts.map((contact) => (
          <Card key={contact.id} className="relative overflow-hidden group">
            <CardHeader className="pb-3 border-b bg-slate-50/50">
              <CardTitle className="text-base font-semibold leading-none">
                {contact.firstName} {contact.lastName}
              </CardTitle>
              <CardDescription className="font-medium text-primary capitalize mt-1">
                {contact.relationship}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Cédula</Label>
                <p className="text-sm font-medium">{contact.cedula}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Teléfono</Label>
                <p className="text-sm font-medium">{contact.phone}</p>
              </div>
              {contact.email && (
                <div>
                  <Label className="text-xs text-muted-foreground">Correo</Label>
                  <p className="text-sm font-medium">{contact.email}</p>
                </div>
              )}
            </CardContent>
            
            {/* Quick Actions (Hover) */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <Button 
                variant="secondary" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => handleOpenEdit(contact)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button 
                variant="destructive" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => handleDelete(contact.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}

        {contacts.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed rounded-lg">
            <Users className="mx-auto h-12 w-12 text-muted-foreground opacity-30 mb-4" />
            <h3 className="text-lg font-medium text-slate-800">No hay contactos registrados</h3>
            <p className="text-sm text-slate-500 mt-1 mb-4">
              Aún no has agregado contactos adicionales para este estudiante.
            </p>
            <Button variant="outline" onClick={handleOpenNew}>
              Agregar el primer contacto
            </Button>
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingContact ? "Editar Contacto" : "Nuevo Contacto"}
            </DialogTitle>
            <DialogDescription>
              Asegúrate de que los datos de contacto sean correctos.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="cedula">Cédula o Pasaporte <span className="text-red-500">*</span></Label>
              <Input
                id="cedula"
                value={formData.cedula}
                onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                placeholder="1700000000"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">Nombres <span className="text-red-500">*</span></Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Juan Carlos"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Apellidos <span className="text-red-500">*</span></Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Pérez Silva"
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="relationship">Parentesco <span className="text-red-500">*</span></Label>
              <Select 
                value={formData.relationship} 
                onValueChange={(val) => setFormData({ ...formData, relationship: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione el parentesco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Abuelo/a">Abuelo/a</SelectItem>
                  <SelectItem value="Tío/a">Tío/a</SelectItem>
                  <SelectItem value="Hermano/a Mayor">Hermano/a Mayor</SelectItem>
                  <SelectItem value="Madrina/Padrino">Madrina/Padrino</SelectItem>
                  <SelectItem value="Transportista">Transportista Escolar</SelectItem>
                  <SelectItem value="Otro">Otro familiar / Amigo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Teléfono Móvil <span className="text-red-500">*</span></Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="099xxxxxxx"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="opcional@email.com"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : "Guardar Contacto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
