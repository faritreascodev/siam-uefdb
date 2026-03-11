# Arquitectura del Sistema — SIAM UEFDB v3

## Versión

| Campo          | Valor              |
|----------------|--------------------|
| Versión API    | 3.0.0              |
| Año lectivo    | 2026-2027          |
| Última revisión | 2026-03-04        |

---

## Stack tecnológico

### Backend (API)
- **Framework**: NestJS 10+
- **Lenguaje**: TypeScript 5
- **Base de datos**: PostgreSQL 15
- **ORM**: Prisma 5
- **Validación**: class-validator + class-transformer
- **Autenticación**: JWT (Passport.js)
- **Documentación**: Swagger/OpenAPI 3.0 → `/api/docs`
- **Correo**: Nodemailer (notificaciones de estados)

### Frontend (Cliente)
- **Framework**: Next.js 14+ (App Router)
- **Estilos**: Tailwind CSS
- **Componentes**: Shadcn/ui (Radix UI)
- **Formularios**: React Hook Form + Zod
- **Autenticación**: NextAuth.js
- **Tablas/Exportación**: @tanstack/react-table · SheetJS (xlsx)

### DevOps
- **Contenedores**: Docker + Docker Compose
- **Almacenamiento**: volúmenes persistentes Docker (DB + uploads)

---

## Estructura de directorios

```text
academyc_system/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma     # Esquema y enums (Gender, Shift, AppStatus…)
│   │   ├── seed.ts           # Seed completo con todos los roles y datos demo
│   │   └── migrations/       # Historial de migraciones
│   ├── src/
│   │   ├── auth/             # JWT, guards, decoradores de roles
│   │   ├── users/            # CRUD de usuarios y asignación de roles
│   │   ├── applications/     # Proceso completo de admisión
│   │   ├── cursillo/         # Sesiones, inscripciones y evaluación
│   │   ├── system-config/    # Configuración global del sistema
│   │   ├── notifications/    # Envío de emails por cambio de estado
│   │   └── audit/            # Registro de acciones
│   └── uploads/              # Documentos y comprobantes subidos
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── admin/        # Panel administrativo (sidebar por rol)
│   │   │   ├── apoderado/    # Portal del representante legal
│   │   │   ├── login/        # Autenticación
│   │   │   └── register/     # Registro
│   │   ├── components/
│   │   │   ├── admin/        # Sidebar, header, componentes del panel
│   │   │   ├── application-form/  # Formulario multi-paso de admisión
│   │   │   └── ui/           # Componentes Shadcn base
│   │   ├── hooks/
│   │   │   └── use-roles.ts  # Hook RBAC con helpers por permiso
│   │   ├── lib/
│   │   │   ├── api-applications.ts
│   │   │   ├── api-cursillo.ts
│   │   │   └── api-config.ts
│   │   └── types/
│   │       └── application.ts  # Tipos compartidos (Gender, Status…)
└── docs/                     # Documentación (este directorio)
```

---

## Control de acceso (RBAC)

El sistema implementa RBAC jerárquico. Cada rol hereda los permisos del siguiente nivel inferior.

### Jerarquía de roles

```
superadmin
  └── admin
        └── principal (rector)
              └── secretary
                    └── apoderado
```

### Tabla de permisos por módulo

| Módulo / Acción               | superadmin | admin | principal | secretary* | apoderado |
|-------------------------------|:---:|:---:|:---:|:---:|:---:|
| Dashboard                     | X | X | X | X |   |
| Ver todas las solicitudes     | X | X | X | X |   |
| Aprobar / Rechazar solicitudes| X | X | X | X |   |
| Gestionar cursillo            | X | X | X | X |   |
| Exportar reportes             | X | X | X | X |   |
| Gestionar usuarios            | X | X |   | * |   |
| Configuración del sistema     | X | X |   |   |   |
| Auditoría                     | X | X |   |   |   |
| Configuración de seguridad    | X |   |   |   |   |
| Propias solicitudes           | X | X | X | X | X |

> (*) Secretary: módulos configurables desde el panel Settings → Secretaría.

### Roles en base de datos

| Nombre      | Descripción |
|-------------|-------------|
| superadmin  | Superadministrador del sistema — acceso total sin restricciones |
| admin       | Administrador académico — gestiona admisiones, usuarios y configuración |
| principal   | Rector/Directivo — revisión y aprobación; sin acceso a usuarios ni config de sistema |
| secretary   | Secretaría — procesamiento diario; módulos configurables por el admin |
| apoderado   | Representante legal — solo sus propias solicitudes |

---

## Flujo de admisión

```
DRAFT → SUBMITTED → UNDER_REVIEW
  ├── REQUIRES_CORRECTION → (vuelve a SUBMITTED)
  ├── REJECTED (fin)
  └── APPROVED
        ├── [Si requiere cursillo] → CURSILLO_SCHEDULED
        │     ├── CURSILLO_APPROVED → PAYMENT_UPLOADED → PAYMENT_VALIDATED → MATRICULATED
        │     └── CURSILLO_REJECTED (fin — cupo liberado)
        └── [Sin cursillo] → PAYMENT_UPLOADED → PAYMENT_VALIDATED → MATRICULATED
```

### Cuándo se requiere cursillo

Un estudiante debe realizar el cursillo si:
- Aspira a **8vo de EGB** o **1ro de Bachillerato**, **y**
- Su institución de procedencia **no es** Unidad Educativa Fiscomisional Don Bosco (UEFDB).

### Materias según nivel

| Nivel            | Materias obligatorias                                   |
|------------------|---------------------------------------------------------|
| 8vo EGB          | Lengua y Literatura, Matemáticas, Inglés                |
| 1ro Bach. (todos)| Matemáticas, Física, Química                            |
| 1ro BT Informática | + Programación (solo esta especialidad)               |

### Criterios de aprobación del cursillo
- Asistencia mínima: **80%** de las sesiones por materia
- Nota mínima: **7 / 10** por materia
- Se deben aprobar **todas** las materias (no hay promedio general)

---

## Configuración del sistema

Los parámetros globales se gestionan desde **Admin → Configuración**.
El sistema usa claves en la tabla `SystemConfig`:

| Clave                    | Ejemplo                        |
|--------------------------|--------------------------------|
| CURRENT_ACADEMIC_YEAR    | 2026-2027                      |
| ADMISSION_OPEN           | true                           |
| ADMISSION_START_DATE     | 2026-01-01                     |
| ADMISSION_END_DATE       | 2026-03-31                     |
| CURSILLO_START_DATE      | 2026-04-01                     |
| CURSILLO_END_DATE        | 2026-05-01                     |
| CURSILLO_MIN_ATTENDANCE  | 80                             |
| CURSILLO_MIN_SCORE       | 7                              |
| ENROLLMENT_START_DATE    | 2026-05-05                     |
| ENROLLMENT_END_DATE      | 2026-06-30                     |
| PAYMENT_AMOUNT           | 150.00                         |
| SECRETARY_MODULES        | JSON con módulos habilitados   |

---

## Características de Lógica Empresarial Clave

A continuación las mecánicas más relevantes desarrolladas dentro del core del proyecto:

### 1. View Engine para Directivos (RBAC UI)
El Rol `rector` (`principal` en la base de datos) tiene una vista limitada dentro del módulo de admisiones:
- No ve el total de solicitudes enviadas por defecto.
- Solo interactúa con aquellas solicitudes que un perfil administrativo superior (`admin` o `secretary`) le asigne explícitamente mediante el motor de **Asignación de Evaluación**.
- La petición de Frontend se intercepta y dirige al endpoint segregado `GET /applications/directivo/assigned` en lugar de listar en bruto el total de admisiones.

### 2. Broadcast de Cambios de Cursillo
El módulo Cursillo expone un sistema de notificaciones masivas para notificar alteraciones (`POST /cursillos/sessions/:id/notify-enrolled`):
- Los roles administrativos pueden corregir y actualizar los Links de Teams, nombres de docentes y horarios.
- Al guardar o activar el trigger de aviso, una cola notifica mediante `NotificationsService` directamente a los apoderados (App + Email) informando de la actualización reciente de la asignatura respectiva sin desbaratar la matrícula inicial del alumno.

### 3. Motor de Asignación a Paralelos y Sustracción de Cupos
Cuando un aplicante supera todas sus metas condicionales y valida su pago (`PAYMENT_VALIDATED` o superior), ocurre el proceso de **Matriculación por Paralelo**:
- Un diálogo evalúa qué paralelos existen para ese Grado / Jornada / Especialidad.
- Evalúa matemáticamente la diferencia (Disponibles vs. Ocupados).
- La asignación transita a `MATRICULATED`, y consume definitivamente 1 cupo del conteo disponible en el Monitor Global.
- Esto se efectúa transaccionalmente; los paralelos sin cupos arrojan errores y se inhabilitan en tiempo real en la Interfaz.
