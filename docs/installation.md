# Guia de Instalacion y Despliegue

Este documento guia el proceso de configuracion del entorno de desarrollo y produccion de SIAM.

## Instalacion con Docker (Recomendado)

El uso de Docker garantiza que todos los servicios funcionen con las versiones exactas necesarias.

### Pasos iniciales

1. Clonar el repositorio y acceder a la carpeta del proyecto.
2. Configurar el Backend:
   * Ir a `backend/`.
   * Copiar `.env.example` a `.env`.
   * Definir `DATABASE_URL` (puedes usar el valor por defecto si usas Docker).
   * Generar un `JWT_SECRET` seguro.
3. Configurar el Frontend:
   * Ir a `frontend/`.
   * Copiar `.env.example` a `.env.local`.
   * Generar un `NEXTAUTH_SECRET`.

### Levantar el entorno

Desde la raiz del monorepo, ejecutar:
```bash
docker-compose up --build -d
```

### Inicializar la Base de Datos

Una vez que los contenedores esten activos, ejecuta:
```bash
# Aplicar migraciones de Prisma
docker exec -it academyc-backend npx prisma migrate dev

# Cargar datos de prueba (optional)
docker exec -it academyc-backend npx prisma db seed
```

## Instalacion Local (Sin Docker)

Si prefieres ejecutar los servicios directamente en tu sistema:

### Backend
1. Tener PostgreSQL instalado y funcionando.
2. `cd backend` e instalar dependencias: `npm install`.
3. Configurar el archivo `.env` apuntando a tu BD local.
4. Generar el cliente de Prisma: `npx prisma generate`.
5. Ejecutar migraciones: `npx prisma migrate dev`.
6. Iniciar servidor: `npm run start:dev`.

### Frontend
1. `cd frontend` e instalar dependencias: `npm install`.
2. Configurar `.env.local` apuntando al API (`NEXT_PUBLIC_API_URL`).
3. Iniciar aplicacion: `npm run dev`.

## Variables de Entorno Requeridas

### Backend
* `DATABASE_URL`: URL de conexion a Postgres.
* `JWT_SECRET`: Clave para firma de tokens.
* `PORT`: Puerto (por defecto 4000).

### Frontend
* `NEXT_PUBLIC_API_URL`: URL base del Backend.
* `NEXTAUTH_URL`: URL base del Frontend.
* `NEXTAUTH_SECRET`: Clave para cifrar sesiones de NextAuth.
