"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [cedula, setCedula] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/request-password-recovery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, cedula }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "No se pudo solicitar la recuperación");
      }

      setSuccess(true);
      toast.success("Solicitud enviada. Un administrador revisará su caso.");
      
      // Redirect after a few seconds
      setTimeout(() => {
        router.push("/login");
      }, 3000);

    } catch (err: any) {
      setError(err.message || "Ocurrió un error al procesar la solicitud");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-4 py-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900">Solicitud Enviada</h3>
        <p className="text-sm text-gray-500">
          Hemos recibido su solicitud de recuperación. Un administrador se pondrá en contacto o reseteará su contraseña pronto. 
          Será redirigido al inicio de sesión.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="cedula" className="block text-sm font-medium text-gray-700">
          Cédula de Identidad
        </label>
        <div className="relative mt-1 rounded-md shadow-sm">
          <input
            id="cedula"
            type="text"
            placeholder="Ingrese su número de cédula"
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            required
            disabled={isLoading}
            className="block w-full rounded-md border-gray-300 pl-4 py-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-gray-50 border transition-all"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Correo Electrónico Registrado
        </label>
        <div className="relative mt-1 rounded-md shadow-sm">
          <input
            id="email"
            type="email"
            placeholder="nombre@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            className="block w-full rounded-md border-gray-300 pl-4 py-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-gray-50 border transition-all"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 text-sm rounded-md text-red-600 bg-red-50 border border-red-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !cedula || !email}
        className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-3 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isLoading ? (
          <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
        ) : null}
        {isLoading ? "Enviando solicitud..." : "Solicitar Recuperación"}
      </button>

      <div className="text-center text-sm">
        <span className="text-gray-600">¿Recordaste tu contraseña? </span>
        <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
          Volver al inicio de sesión
        </Link>
      </div>
    </form>
  );
}
