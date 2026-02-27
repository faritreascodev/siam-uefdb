import Link from "next/link";
import Image from "next/image";
import { ArrowRight, UserPlus, ShieldCheck, FileText, BarChart3 } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/assets/logo-uefdb.png"
              alt="SIAM UEFDB Logo"
              width={50}
              height={50}
              className="object-contain"
            />
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tighter text-slate-900 uppercase leading-none">SIAM</span>
              <span className="text-[10px] font-bold text-primary tracking-widest uppercase">UEF Don Bosco</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-semibold hover:text-primary transition-colors px-3 py-2">
              Iniciar Sesión
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:opacity-90 transition-all shadow-sm shadow-primary/20"
            >
              Registrarse
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden border-b bg-gradient-to-b from-primary/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-8 border border-primary/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              ADMISIÓN 2026-2027
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] mb-8">
              Portal de <br />
              <span className="text-primary italic">Admisiones</span> & <span className="text-primary italic">Matrículas</span>
            </h1>
            <p className="text-lg text-slate-600 mb-12 leading-relaxed font-medium max-w-2xl mx-auto">
              Sistema oficial de la Unidad Educativa Fiscomisional Don Bosco.
              Realice su proceso de ingreso de forma segura y completamente en línea.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <Link
                href="/login"
                className="group flex items-center justify-center gap-3 bg-primary text-primary-foreground px-10 py-5 rounded-2xl font-bold hover:shadow-2xl hover:shadow-primary/30 transition-all transform hover:-translate-y-1"
              >
                Acceso al Portal
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/register"
                className="flex items-center justify-center gap-3 bg-white text-slate-900 border-2 border-slate-200 px-10 py-5 rounded-2xl font-bold hover:bg-slate-50 transition-all hover:border-primary/30"
              >
                Crear una Cuenta
                <UserPlus className="w-5 h-5 text-primary" />
              </Link>
            </div>
          </div>
        </div>

        {/* Abstract Background Decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10"></div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
              Un Proceso Claro y Sencillo
            </h2>
            <div className="h-1.5 w-20 bg-primary mx-auto mt-4 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="p-10 rounded-3xl bg-slate-50 border border-slate-100 hover:border-primary/20 hover:bg-white hover:shadow-2xl transition-all duration-300 group">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Solicitud Inteligente</h3>
              <p className="text-slate-500 leading-relaxed font-medium">
                Complete su solicitud paso a paso con un formulario claro y organizado.
              </p>
            </div>

            <div className="p-10 rounded-3xl bg-slate-50 border border-slate-100 hover:border-primary/20 hover:bg-white hover:shadow-2xl transition-all duration-300 group">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Seguridad Institucional</h3>
              <p className="text-slate-500 leading-relaxed font-medium">
                Protección de su información y validación segura de documentos durante todo el proceso.
              </p>
            </div>

            <div className="p-10 rounded-3xl bg-slate-50 border border-slate-100 hover:border-primary/20 hover:bg-white hover:shadow-2xl transition-all duration-300 group">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Control en Tiempo Real</h3>
              <p className="text-slate-500 leading-relaxed font-medium">
                Revise el estado de su solicitud y reciba notificaciones en cada actualización.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-16 border-t bg-slate-950 text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex items-center gap-4">
              <Image
                src="/assets/logo-uefdb.png"
                alt="Logo UEFDB"
                width={40}
                height={40}
                className="opacity-100"
              />
              <div className="h-8 w-px bg-slate-800"></div>
              <span className="text-lg font-black tracking-tighter text-white uppercase">SIAM</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-2">Sistema Institucional</div>
              <div className="text-sm font-medium text-slate-300">
                Unidad Educativa Fiscomisional Don Bosco
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Esmeraldas, Ecuador &copy; 2026</p>
              <p className="text-xs">Desarrollado por <span className="text-white font-bold">Farit Reasco</span></p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
