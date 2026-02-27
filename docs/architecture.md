# Arquitectura del Sistema: SIAM - UEFDB

Este documento describe la arquitectura técnica, el stack tecnológico y la organización del proyecto SIAM.

## Stack Tecnologico Principal

El sistema utiliza un enfoque de monorepo para facilitar la consistencia de tipos y la gestión compartida de librerías.

### Aplicacion Backend (API)
* Framework: NestJS (v10+)
* Lenguaje: TypeScript
* Base de Datos: PostgreSQL (v15)
* Acceso a Datos (ORM): Prisma
* Documentacion: Swagger (OpenAPI 3.0)

### Aplicacion Frontend (Cliente)
* Framework: Next.js (v14+) utilizando App Router
* Estilos: Tailwind CSS
* Componentes: Shadcn/ui (Radix UI)
* Validacion de Formularios: React Hook Form + Zod
* Temas: Soporte para modo claro y oscuro con Next-Themes

### DevOps e Infraestructura
* Orquestacion: Docker + Docker Compose
* Comunicacion entre servicios: Red aislada de Docker
* Almacenamiento: Volumenes persistentes para la base de datos y archivos cargados (uploads)

## Estructura de Directorios

El monorepo esta organizado de la siguiente manera:

```text
academyc-system/
├── backend/            # Aplicacion Servidora (NestJS)
│   ├── prisma/         # Esquema de base de Datos y Migraciones
│   ├── src/            # Codigo Fuente del API
│   ├── uploads/        # Almacenamiento de Archivos (Local)
│   └── Dockerfile      # Configuracion de Imagen para el Backend
├── frontend/           # Aplicacion Cliente (Next.js)
│   ├── src/            # Codigo Fuente del Frontend
│   │   ├── app/        # Rutas y Paginas (App Router)
│   │   ├── components/ # Componentes de Interfaz
│   │   ├── lib/        # Utilidades y Clientes de API
│   │   └── types/      # Definiciones de Tipos TypeScript
│   └── Dockerfile      # Configuracion de Imagen para el Frontend
├── docs/               # Documentacion Detallada del Sistema
└── docker-compose.yml  # Orquestacion de Servicios Completos
```

## Sistema de Permisos (RBAC)

El acceso al sistema esta protegido mediante un control de acceso basado en roles (Role-Based Access Control). Los roles permitidos son:

1. Superadmin: Control absoluto sobre el sistema y gestion de usuarios.
2. Administrativo: Acceso a la gestion general de solicitudes y reportes.
3. Secretario: Procesamiento operativo de solicitudes y validacion de documentos.
4. Directivo: Supervisión y reportes estadisticos de alto nivel.
5. Usuario (Apoderado): Acceso limitado para crear y seguir sus propias solicitudes de admision.

Cada peticion al servidor es validada mediante un JWT (JSON Web Token) que contiene el identificador y los privilegios del usuario autenticado.
