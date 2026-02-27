"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === 'CredentialsSignin') {
             setError("Credenciales inválidas");
        } else {
             setError(result.error);
        }
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("Ocurrió un error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Correo electrónico
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
            className="block w-full rounded-md border-gray-300 pl-4 py-3 focus:border-primary focus:ring-primary sm:text-sm bg-gray-50 border transition-all"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Contraseña
        </label>
        <div className="relative mt-1 rounded-md shadow-sm">
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            className="block w-full rounded-md border-gray-300 pl-4 py-3 focus:border-primary focus:ring-primary sm:text-sm bg-gray-50 border transition-all"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
            Recordarme
          </label>
        </div>

        <div className="text-sm">
          <Link
            href="/forgot-password"
            className="font-medium text-primary hover:text-primary"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </div>

      {error && (
        <div className={`p-3 text-sm rounded-md ${error.includes("pendiente") ? 'text-yellow-700 bg-yellow-50 border border-yellow-200' : 'text-red-600 bg-red-50 border border-red-200'}`}>
           {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="flex w-full justify-center rounded-md border border-transparent bg-primary py-3 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isLoading ? (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        ) : null}
        {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
      </button>

      <div className="text-center text-sm">
        <span className="text-gray-600">¿No tienes una cuenta? </span>
        <Link href="/register" className="font-medium text-primary hover:text-primary">
          Regístrate aquí
        </Link>
      </div>
    </form>
  );
}
