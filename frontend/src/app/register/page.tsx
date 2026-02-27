import { RegisterForm } from "@/components/auth/register-form";
import Link from "next/link";
import Image from "next/image";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="flex flex-col items-center">
          <div className="mb-6">
            <Image
              src="/assets/logo-uefdb.png"
              alt="Logo UEFDB"
              width={80}
              height={80}
              className="object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold">Crear Cuenta</h1>
          <p className="mt-2 text-sm text-gray-600">
            Regístrate para acceder al sistema académico
          </p>
        </div>

        <RegisterForm />

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="font-semibold text-primary hover:text-primary/80">
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
