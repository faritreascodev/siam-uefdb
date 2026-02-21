import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-2xl text-center space-y-8">
        <h1 className="text-6xl font-bold tracking-tight">
          Academic System 🎓
        </h1>
        <p className="text-xl text-muted-foreground">
          Sistema de gestión académica con autenticación y control de acceso basado en roles
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <Link
            href="/login"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium"
          >
            Dashboard
          </Link>
        </div>
        <div className="mt-12 p-6 bg-muted rounded-lg text-left">
          <h3 className="font-semibold mb-2">Credenciales de Prueba:</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Admin:</strong> admin@academyc.com / Admin123!</p>
            <p><strong>Usuario:</strong> apoderado@academyc.com / Apoderado123!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
