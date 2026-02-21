import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Academic System</h1>
          <p className="mt-2 text-sm text-gray-600">
            Ingresa tus credenciales para continuar
          </p>
        </div>
        <LoginForm />
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Credenciales de prueba:</p>
          <p className="mt-1">Admin: admin@academyc.com / Admin123!</p>
          <p>Usuario: apoderado@academyc.com / Apoderado123!</p>
        </div>
      <div className="mt-4 text-center text-sm">
          <p className="text-gray-600">
            ¿No tienes una cuenta?{" "}
            <a href="/register" className="font-semibold text-primary hover:text-primary/80">
              Regístrate aquí
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
