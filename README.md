# SIAM - UEFDB: Sistema Integral de Admisiones y Matrículas

## Presentacion

SIAM (Sistema Integral de Admisiones y Matrículas) es una plataforma empresarial diseñada especificamente para la Unidad Educativa Fiscomisional Don Bosco. Este sistema centraliza y optimiza los procesos criticos de ingreso estudiantil, gestion de disponibilidad y generacion de reportes administrativos.

La plataforma ha sido construida bajo estandares modernos de desarrollo, garantizando una arquitectura escalable, segura y con una experiencia de usuario de alto nivel tanto para el personal administrativo como para los apoderados.

## Secciones Principales del Sistema

### Gestion de Procesos de Admision
* Flujo de trabajo automatizado para el seguimiento de solicitudes desde el borrador hasta la matriculacion.
* Sistema robusto de gestion documental con validaciones integradas.
* Control especializado para los niveles de ingreso masivos (8vo EGB y 1ero BGU), incluyendo la gestion de cursillos.

### Administracion y Seguridad
* Control de acceso basado en roles (RBAC) con 5 niveles de permisos diferenciados.
* Modulo de gestion de usuarios con flujo de aprobacion administrativa para nuevos registros.
* Proteccion de rutas y endpoints mediante autenticacion JWT y sesiones seguras.

### Inteligencia de Datos y Reportes
* Generacion inmediata de documentos PDF oficiales para cada solicitud.
* Dashboard administrativo con metricas en tiempo real sobre el estado de las admisiones y ocupacion de cupos.
* Sistema de notificaciones centralizado para mantener informados a los usuarios sobre el progreso de su tramite.

## Stack Tecnologico (Arquitectura Monorepo)

* Backend: NestJS con PostgreSQL y Prisma ORM.
* Frontend: Next.js 14+ utilizando App Router, Tailwind CSS y Shadcn/ui.
* Infraestructura: Containerizacion completa con Docker y Docker Compose.
* Lenguaje: Programacion integral en TypeScript (Type-safe de extremo a extremo).

## Documentacion Detallada

Para una comprension profunda del sistema, consulte los siguientes documentos tecnicos:

1. [Arquitectura y Stack Tecnologico](docs/architecture.md)
2. [Guia del Backend y Base de Datos](docs/backend.md)
3. [Guia del Frontend y UI/UX](docs/frontend.md)
4. [Instalacion, Configuracion y Despliegue](docs/installation.md)

## Instalacion Rapida con Docker

```bash
# 1. Configurar variables de entorno en carpetas /backend y /frontend
# 2. Levantar la infraestructura
docker-compose up --build -d

# 3. Inicializar base de datos
docker exec -it academyc-backend npx prisma migrate dev
```

## Acceso Directo a Servicios
* Frontend: http://localhost:3000
* Backend API: http://localhost:4000
* Documentacion API (Swagger): http://localhost:4000/api/docs

---
**Desarrollado por Farit Reasco :D**