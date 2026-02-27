"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { User, Mail, Shield, ArrowLeft, Key, Save, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRoles } from "@/hooks/use-roles";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function MiPerfilPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { roles } = useRoles();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  
  // Basic form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [cedula, setCedula] = useState("");
  const [telefono, setTelefono] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (status !== "authenticated") return;
      
      try {
        // @ts-ignore
        const token = session?.accessToken || session?.user?.accessToken;
        const res = await fetch(`${API_URL}/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (!res.ok) throw new Error("Error al obtener perfil");
        
        const data = await res.json();
        setProfile(data);
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        setCedula(data.cedula || "");
        setTelefono(data.telefono || "");
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("No se pudo cargar la información del perfil");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [session, status]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName) {
      toast.error("Nombres y Apellidos son obligatorios");
      return;
    }

    setSaving(true);
    try {
      // @ts-ignore
      const token = session?.accessToken || session?.user?.accessToken;
      const res = await fetch(`${API_URL}/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName,
          lastName,
          cedula,
          telefono
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al actualizar perfil");
      }

      toast.success("Perfil actualizado correctamente");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-slate-50/50">
      <nav className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard" 
                className="p-2 -ml-2 text-slate-500 hover:text-primary hover:bg-slate-100 rounded-full transition-colors"
                title="Volver"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-xl font-bold tracking-tight">Mi Perfil</h1>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium leading-none">{session.user.email}</p>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="h-24 w-24 bg-primary/10 text-primary rounded-full flex items-center justify-center text-4xl font-bold uppercase">
                    {firstName.charAt(0) || session.user.email?.charAt(0) || "U"}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{firstName} {lastName}</h3>
                    <p className="text-sm text-muted-foreground break-all">{session.user.email}</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 mt-2">
                    {roles.map((role) => (
                      <span key={role} className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium capitalize flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  Seguridad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Para cambiar tu contraseña, utiliza la opción de "Olvidé mi contraseña" en la pantalla de inicio de sesión o contacta al administrador.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <form onSubmit={handleUpdate}>
              <Card>
                <CardHeader>
                  <CardTitle>Información Personal</CardTitle>
                  <CardDescription>
                    Actualiza tus datos para mantener tu perfil al día.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Nombres</Label>
                      <Input 
                        id="firstName" 
                        value={firstName} 
                        onChange={(e) => setFirstName(e.target.value)} 
                        placeholder="Tus Nombres"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Apellidos</Label>
                      <Input 
                        id="lastName" 
                        value={lastName} 
                        onChange={(e) => setLastName(e.target.value)} 
                        placeholder="Tus Apellidos"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Correo Electrónico (Solo Lectura)</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="email" 
                          value={session.user.email || ""} 
                          readOnly 
                          className="pl-9 bg-slate-50 text-slate-500 font-medium cursor-not-allowed"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">El correo no puede modificarse.</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cedula">Cédula de Identidad</Label>
                      <Input 
                        id="cedula" 
                        value={cedula} 
                        onChange={(e) => setCedula(e.target.value.replace(/\D/g, '').substring(0,10))} 
                        placeholder="1234567890"
                        maxLength={10}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono de Contacto</Label>
                    <Input 
                      id="telefono" 
                      value={telefono} 
                      onChange={(e) => setTelefono(e.target.value)} 
                      placeholder="Ej: 0987654321"
                    />
                  </div>

                </CardContent>
                <CardFooter className="flex justify-end pt-6 border-t mt-6">
                  <Button type="submit" disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Guardar Cambios
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </div>

        </div>
      </main>
    </div>
  );
}
