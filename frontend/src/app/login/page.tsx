import { LoginForm } from "@/components/auth/login-form";
import { LoginCarousel } from "@/components/auth/login-carousel";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Side - Form */}
      <div className="flex flex-col justify-center w-full px-4 py-12 lg:w-1/2 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl text-left">
              Bienvenido
            </h1>
            <p className="mt-2 text-sm text-gray-600 text-left">
              Ingresa tus credenciales para acceder al sistema académico.
            </p>
          </div>

          <LoginForm />

          <div className="mt-8 text-center text-xs text-gray-400">
             <p>Credenciales demo:</p>
             <p>Admin: admin@academyc.com / Admin123!</p>
           </div>
        </div>
      </div>

      {/* Right Side - Branding/Illustration */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden">
        <LoginCarousel />
      </div>
    </div>
  );
}
