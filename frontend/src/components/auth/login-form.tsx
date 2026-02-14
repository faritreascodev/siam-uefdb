"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

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
        // NextAuth doesn't always return the exact error message in `result.error` for credentials provider.
        // It often returns 'CredentialsSignin' or similar if we throw.
        // However, if we custom return null or throw correctly, we might catch it.
        // For now, let's show the error if it's not the generic 'CredentialsSignin'
        if (result.error === 'CredentialsSignin') {
             setError("Credenciales inválidas");
        } else {
             setError(result.error); // Show specific error (e.g. "User is inactive")
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>
      {error && (
        <>
          {error.includes("pendiente de aprobación") ? (
             <div className="p-3 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md">
               {error}
             </div>
          ) : (
            <div className="text-sm text-red-500">{error}</div>
          )}
        </>
      )}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
      >
        {isLoading ? "Ingresando..." : "Iniciar Sesión"}
      </button>
    </form>
  );
}
