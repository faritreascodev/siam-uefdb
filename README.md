# Academic System - Fullstack Monorepo

Sistema fullstack moderno con autenticación robusta, RBAC, y arquitectura containerizada.

## 🏗️ Stack Tecnológico

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: TailwindCSS + Shadcn/ui
- **Autenticación**: NextAuth.js v5

### Backend
- **Framework**: NestJS
- **Lenguaje**: TypeScript
- **Base de Datos**: PostgreSQL 15
- **ORM**: Prisma
- **Autenticación**: JWT Strategy

### Infraestructura
- **Containerización**: Docker + Docker Compose
- **Arquitectura**: Monorepo (Frontend + Backend)

## 📁 Estructura del Proyecto

```
academyc-system/
├── frontend/          # Next.js Application
├── backend/           # NestJS Application
├── docker-compose.yml # Orchestration
└── README.md
```

## 🚀 Inicio Rápido

### Prerrequisitos

- Docker y Docker Compose instalados
- Node.js 20+ (para desarrollo local sin Docker)
- PostgreSQL 15+ (para desarrollo local sin Docker)

### 1. Clonar y Configurar Variables de Entorno

```bash
# Clonar repositorio
git clone <repository-url>
cd academyc-system

# Configurar Backend
cd backend
cp .env.example .env
# Editar .env y cambiar JWT_SECRET

# Configurar Frontend
cd ../frontend
cp .env.example .env.local
# Editar .env.local y cambiar NEXTAUTH_SECRET

cd ..
```

### 2. Levantar con Docker Compose

```bash
# Construir y levantar todos los servicios
docker-compose up --build

# O en modo detached (segundo plano)
docker-compose up -d --build
```

Los servicios estarán disponibles en:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **PostgreSQL**: localhost:5432

### 3. Ejecutar Migraciones de Prisma

```bash
# Acceder al contenedor del backend
docker exec -it academyc-backend sh

# Ejecutar migraciones
npx prisma migrate dev --name init

# (Opcional) Abrir Prisma Studio
npx prisma studio
```

### 4. Crear Usuario Inicial (Seed)

```bash
# Dentro del contenedor del backend
npx prisma db seed

# O manualmente via API
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin123!",
    "firstName": "Super",
    "lastName": "Admin",
    "roles": ["superadmin"]
  }'
```

## 🔧 Desarrollo Local (sin Docker)

### Backend

```bash
cd backend

# Instalar dependencias
npm install

# Configurar .env con DATABASE_URL apuntando a tu PostgreSQL local
# DATABASE_URL="postgresql://user:password@localhost:5432/academyc_db"

# Generar Prisma Client
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev

# Iniciar en modo desarrollo
npm run start:dev
```

### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar .env.local
# NEXT_PUBLIC_API_URL="http://localhost:4000"

# Instalar Shadcn/ui (primera vez)
npx shadcn-ui@latest init

# Iniciar en modo desarrollo
npm run dev
```

## 🔐 Autenticación y RBAC

### Roles Disponibles

- **user**: Usuario estándar con acceso limitado
- **superadmin**: Acceso completo a todos los recursos

### Flujo de Autenticación

1. Usuario envía credenciales a `/auth/login` (backend)
2. Backend valida y retorna JWT con información de usuario y roles
3. Frontend usa NextAuth.js para gestionar sesión
4. Middleware de Next.js protege rutas según roles
5. Backend valida JWT en cada request con Guards

### Endpoints de Autenticación (Backend)

```bash
# Registro
POST /auth/register
Body: { email, password, firstName, lastName, roles }

# Login
POST /auth/login
Body: { email, password }
Response: { access_token, user: { id, email, roles } }

# Perfil (requiere autenticación)
GET /auth/profile
Headers: { Authorization: Bearer <token> }
```

### Rutas Protegidas (Frontend)

- `/login` - Página de login (pública)
- `/dashboard` - Requiere autenticación
- `/admin/*` - Requiere rol 'superadmin'

## 🐳 Comandos Docker Útiles

```bash
# Ver logs
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f backend
docker-compose logs -f frontend

# Reiniciar un servicio
docker-compose restart backend

# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes (⚠️ borra datos)
docker-compose down -v

# Reconstruir sin caché
docker-compose build --no-cache

# Ejecutar comando en contenedor
docker exec -it academyc-backend sh
docker exec -it academyc-frontend sh
```

## 📦 Scripts Disponibles

### Backend

- `npm run start` - Iniciar en producción
- `npm run start:dev` - Iniciar con hot-reload
- `npm run build` - Compilar aplicación
- `npm run test` - Ejecutar tests

### Frontend

- `npm run dev` - Iniciar desarrollo
- `npm run build` - Compilar producción
- `npm run start` - Iniciar producción
- `npm run lint` - Linter

## 🔒 Seguridad

### Variables Sensibles

**⚠️ IMPORTANTE**: Antes de desplegar a producción:

1. Generar `JWT_SECRET` único:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. Generar `NEXTAUTH_SECRET` único:
   ```bash
   openssl rand -base64 32
   ```

3. Cambiar credenciales de PostgreSQL por defecto

### Buenas Prácticas

- ✅ Nunca commitear archivos `.env`
- ✅ Usar HTTPS en producción
- ✅ Implementar rate limiting en endpoints públicos
- ✅ Validar y sanitizar todas las entradas
- ✅ Usar variables de entorno para secretos
- ✅ Mantener dependencias actualizadas

## 🗄️ Base de Datos

### Modelos Prisma

- **User**: Usuarios del sistema
- **Role**: Roles disponibles (RBAC)
- **UserRole**: Relación many-to-many

### Comandos Prisma

```bash
# Generar cliente
npx prisma generate

# Crear migración
npx prisma migrate dev --name <nombre>

# Aplicar migraciones
npx prisma migrate deploy

# Abrir Prisma Studio (GUI)
npx prisma studio

# Resetear base de datos (⚠️ desarrollo)
npx prisma migrate reset
```

## 🧪 Testing

### Backend (NestJS)

```bash
cd backend
npm run test          # Unit tests
npm run test:e2e      # E2E tests
npm run test:cov      # Coverage
```

### Frontend (Next.js)

```bash
cd frontend
npm run test
```

## 📚 Documentación Adicional

- [Prisma Docs](https://www.prisma.io/docs)
- [NestJS Docs](https://docs.nestjs.com)
- [Next.js Docs](https://nextjs.org/docs)
- [NextAuth.js v5](https://authjs.dev)
- [TailwindCSS](https://tailwindcss.com/docs)
- [Shadcn/ui](https://ui.shadcn.com)

## 🤝 Contribuir

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

MIT License - ver archivo LICENSE para detalles

## 👥 Soporte

Para preguntas o problemas, abrir un issue en el repositorio.

---

**Desarrollado con ❤️ usando Next.js, NestJS y Docker**
