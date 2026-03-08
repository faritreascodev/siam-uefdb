# Documentación del Backend: API y Persistencia

El backend de SIAM gestiona la lógica de negocio, el almacenamiento de datos y la seguridad mediante una arquitectura modular en NestJS.

## Módulos Principales

El sistema se organiza en módulos independientes para optimizar el mantenimiento y la escalabilidad:

* **Auth**: Gestión de registros, inicio de sesión y generación de tokens JWT. Implementa flujos de aprobación para nuevos usuarios.
* **Users**: Administración de perfiles y permisos de usuario.
* **Applications**: Núcleo del sistema para el ciclo de vida de solicitudes (Draft, Submitted, Under Review, Matriculated). Incluye la lógica de continuidad para estudiantes antiguos mediante búsqueda por cédula.
* **Quotas**: Control de cupos por jornada, nivel académico y paralelo.
* **Reports**: Generación de reportes dinámicos en formato PDF y exportación de datos en CSV.
* **Notifications**: Sistema automatizado de alertas internas para cambios de estado.
* **External-APIs**: Interfaz para la consulta de historial académico externo y datos históricos.

## Lógica de Continuidad Académica

El sistema integra una funcionalidad de autocompletado automatizado para agilizar el registro de estudiantes con historial previo en la institución:

1. **Consulta de Identidad**: El endpoint `GET /applications/search-cedula/:cedula` consulta la base de datos de registros académicos históricos (`AcademicRecord`).
2. **Recuperación de Información**: Al identificar un registro existente, se recuperan automáticamente los datos personales y familiares de la última solicitud procesada.
3. **Exención de Procesos**: El motor de reglas identifica si el estudiante proviene de la propia institución, aplicando automáticamente la exención de cursillos de admisión.
* **Extra-contacts**: Módulo para la gestión de contactos de emergencia adicionales por solicitud.

## Persistencia de Datos (Prisma)

Se utiliza PostgreSQL como motor de base de datos relacional. El esquema define las siguientes entidades fundamentales:

* **User**: Credenciales de acceso (encriptadas con bcrypt) y metadatos de usuario.
* **Role**: Definición jerárquica de privilegios.
* **Application**: Entidad central que consolida la información del estudiante, documentación y estados administrativos.
* **ApplicationDocument**: Gestión de archivos y requisitos cargados.
* **AdmissionQuota**: Registro técnico de disponibilidad y capacidad institucional.
* **PasswordRecoveryRequest**: Gestión de solicitudes de restablecimiento de contraseña.

## Seguridad y Autenticación

1. El sistema valida las credenciales y el estado de aprobación de la cuenta.
2. Se genera un token JWT con vigencia definida por parámetros de configuración.
3. El intercambio de datos se protege mediante el encabezado `Authorization: Bearer <token>` en cada transacción.

## Motor de Reportes Corporativos

El backend emplea Puppeteer para la generación de documentos oficiales. Esto garantiza la emisión de reportes con alta fidelidad visual, permitiendo la inclusión de elementos técnicos como sellos digitales o registros institucionales.
