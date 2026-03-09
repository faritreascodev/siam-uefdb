# Diferenciadores de Roles — Sistema de Admisiones UEFDB

## Jerarquía de Roles

```
SUPERADMIN (Mayor privilegio)
    └── ADMIN
        └── RECTOR (Rector/Directivo)
            └── SECRETARIA (Secretaria)
                └── APODERADO (Menor privilegio)
```

---

## Características Distintivas por Rol

### 1. SUPERADMIN
**Descripción:** Control total del sistema, acceso sin restricciones a todas las funcionalidades, incluyendo configuración de seguridad y sistema.

**Capacidades Únicas:**
- Incluido: Configuración de seguridad y variables de sistema
- Incluido: Acceso completo a logs de auditoría
- Incluido: Puede asignar y revocar cualquier rol (incluyendo admin)
- Incluido: Configuración avanzada del sistema (SMTP, pagos, etc.)
- Incluido: Puede ver y modificar TODO sin restricciones
- Incluido: Acceso a configuración de campos dinámicos del formulario
- Incluido: Gestión de módulos para secretaría

**Diferenciador clave:** Único rol que puede crear y gestionar otros administradores

---

### 2. ADMIN (Administrador Académico)
**Descripción:** Gestiona el proceso académico y de admisiones, usuarios y configuración operativa. No tiene acceso a configuración de seguridad del sistema.

**Capacidades Distintivas:**
- Incluido: Gestión completa de solicitudes de admisión (aprobar, rechazar, asignar)
- Incluido: Crear, editar y eliminar usuarios (excepto superadmin)
- Incluido: Configuración operativa: año lectivo, periodos de admisión, cupos
- Incluido: Gestión de cursillos y paralelos
- Incluido: Acceso a reportes y estadísticas completas
- Incluido: Auditoría de acciones del sistema
- Incluido: Configuración dinámica de formularios (agregar/quitar campos, editar opciones)
- Incluido: Puede configurar permisos de secretaría
- Restringido: NO puede modificar configuración de seguridad del sistema
- Restringido: NO puede asignar rol "admin" o "superadmin"

**Diferenciador clave:** Gestión académica completa pero sin acceso a seguridad del sistema

---

### 3. RECTOR (Rector/Directivo)
**Descripción:** Supervisión y aprobación de procesos académicos. Validación de reportes y supervisión de estadísticas globales.

**Capacidades Distintivas:**
- Incluido: Visualización de todas las solicitudes de admisión
- Incluido: Aprobar o rechazar solicitudes (flujo de aprobación)
- Incluido: Asignar solicitudes a otros directivos
- Incluido: Acceso a reportes y estadísticas (solo lectura)
- Incluido: Visualización de información de cursillos
- Incluido: Ver dashboard con métricas globales
- Restringido: NO puede crear ni editar usuarios
- Restringido: NO puede modificar configuración del sistema
- Restringido: NO puede gestionar cupos ni paralelos
- Restringido: NO tiene acceso a auditoría
- Restringido: NO puede configurar formularios

**Diferenciador clave:** Supervisión y aprobación sin capacidad de configuración

---

### 4. SECRETARIA (Secretaria)
**Descripción:** Operación diaria del proceso de admisiones y matriculación. Acceso modular configurable.

**Capacidades Distintivas:**
- Incluido: Procesar solicitudes día a día (revisar, solicitar correcciones)
- Incluido: Validación de pagos de matrícula
- Incluido: Programar sesiones de cursillo
- Incluido: Asignación de paralelos a estudiantes admitidos
- Incluido: Gestión de contactos adicionales de emergencia
- Incluido: Búsqueda avanzada de solicitudes (nombres, apellidos, cédula)
- Incluido: Módulos configurables:
  - Dashboard
  - Admisiones
  - Matriculación
  - Cupos
  - Cursillos
  - Reportes (si está habilitado)
  - Usuarios (si está habilitado)
  - Configuración (si está habilitado)
  - Auditoría (si está habilitado)
- Restringido: NO puede aprobar/rechazar solicitudes (solo preparar para revisión)
- Restringido: NO puede gestionar usuarios (a menos que esté configurado)
- Restringido: NO puede modificar configuración del sistema
- Restringido: NO puede configurar formularios dinámicos

**Diferenciador clave:** Operación diaria con acceso modular personalizable

---

### 5. APODERADO (Representante Legal)
**Descripción:** Acceso limitado solo a sus propias solicitudes de admisión.

**Capacidades Únicas:**
- Incluido: Crear borradores de solicitudes para sus representados
- Incluido: Completar y actualizar datos del formulario de admisión
- Incluido: Subir documentos requeridos (cédulas, certificados, fotos)
- Incluido: Enviar solicitudes completas
- Incluido: Ver estado de sus solicitudes
- Incluido: Responder a solicitudes de corrección
- Incluido: Cargar comprobante de pago
- Incluido: Validación precoz de cupos (alertas de disponibilidad en tiempo real)
- Incluido: Gestionar hasta 3 contactos adicionales de emergencia por estudiante
- Restringido: NO puede ver solicitudes de otros apoderados
- Restringido: NO tiene acceso al panel administrativo
- Restringido: NO puede modificar una solicitud ya enviada (excepto correcciones solicitadas)

**Diferenciador clave:** Acceso exclusivo a sus propias solicitudes

---

## Matriz de Permisos Detallada

| Funcionalidad | Superadmin | Admin | Rector | Secretaria* | Apoderado |
|---------------|:----------:|:-----:|:---------:|:----------:|:---------:|
| **ADMISIONES** |
| Ver todas las solicitudes | Permitido | Permitido | Permitido | Permitido | Denegado |
| Ver mis solicitudes | Permitido | Permitido | Permitido | Permitido | Permitido |
| Crear solicitud | Permitido | Permitido | Denegado | Denegado | Permitido |
| Enviar a revisión | Permitido | Permitido | Permitido | Permitido | Denegado |
| Aprobar/Rechazar | Permitido | Permitido | Permitido | Denegado | Denegado |
| Solicitar correcciones | Permitido | Permitido | Permitido | Permitido | Denegado |
| Asignar a directivo | Permitido | Permitido | Permitido | Permitido | Denegado |
| Eliminar solicitud | Permitido | Permitido | Permitido | Permitido | Restringido** |
| **PAGOS** |
| Cargar comprobante | Permitido | Permitido | Denegado | Denegado | Permitido |
| Validar pago | Permitido | Permitido | Permitido | Permitido | Denegado |
| **CURSILLOS** |
| Programar sesión | Permitido | Permitido | Permitido | Permitido | Denegado |
| Registrar resultado | Permitido | Permitido | Permitido | Permitido | Denegado |
| Gestionar cursos | Permitido | Permitido | Permitido | Permitido | Denegado |
| **MATRICULACIÓN** |
| Asignar paralelo | Permitido | Permitido | Permitido | Permitido | Denegado |
| Gestionar cupos | Permitido | Permitido | Denegado | Condicional* | Denegado |
| **USUARIOS** |
| Ver usuarios | Permitido | Permitido | Denegado | Condicional* | Denegado |
| Crear usuario | Permitido | Permitido | Denegado | Condicional* | Denegado |
| Editar usuario | Permitido | Permitido | Denegado | Condicional* | Denegado |
| Asignar roles | Permitido | Restringido*** | Denegado | Denegado | Denegado |
| Aprobar registros | Permitido | Permitido | Denegado | Condicional* | Denegado |
| **CONFIGURACIÓN** |
| Config. del sistema | Permitido | Denegado | Denegado | Denegado | Denegado |
| Config. operativa | Permitido | Permitido | Denegado | Denegado | Denegado |
| Config. formularios | Permitido | Permitido | Denegado | Denegado | Denegado |
| Config. secretaría | Permitido | Permitido | Denegado | Denegado | Denegado |
| **REPORTES** |
| Ver estadísticas | Permitido | Permitido | Permitido | Condicional* | Denegado |
| Exportar reportes | Permitido | Permitido | Permitido | Condicional* | Denegado |
| **AUDITORÍA** |
| Ver logs | Permitido | Permitido | Denegado | Condicional* | Denegado |

**Notas:**
- `*` Secretaría: Acceso configurable por el administrador
- `**` Apoderado: Solo puede eliminar solicitudes en estado DRAFT
- `***` Admin: No puede asignar roles "admin" o "superadmin"

---

## Configuración Dinámica de Formularios (Admin/Superadmin)

### Funcionalidad Exclusiva de Administradores
Los administradores tienen acceso a un **Configurador Visual de Formularios** que permite:

1. **Habilitar/Deshabilitar Campos**
   - Decidir qué campos se muestran en el formulario de admisión
   - Ejemplo: Deshabilitar "Ocupación del Padre" si no es necesario

2. **Modificar Opciones de Listas Desplegables**
   - Editar opciones de grados (agregar 11vo EGB si es necesario)
   - Modificar especialidades de BGU
   - Personalizar tipos de parentesco
   - Agregar/quitar tipos de documentos requeridos

3. **Gestionar Secciones del Formulario**
   - **Datos del Estudiante:** Nombre, cédula, género, nacionalidad, etc.
   - **Datos Familiares:** Padre, madre, representante, contactos de emergencia
   - **Datos Académicos:** Grado, especialidad, institución anterior
   - **Datos de Salud:** Tipo de sangre, discapacidad, cuidados especiales
   - **Documentos:** Tipos de documentos requeridos

4. **Configurar Validaciones**
   - Marcar campos como obligatorios/opcionales
   - Definir texto de ayuda para cada campo
   - Establecer placeholders personalizados

### Casos de Uso de Escalabilidad
Esta funcionalidad permite que el sistema se adapte a:
- **Otros colegios** con diferentes requisitos de admisión
- **Cambios de política educativa** sin necesidad de código
- **Procesos de admisión personalizados** por institución

---

## Casos de Uso Prácticos

### Escenario 1: Proceso Normal de Admisión
1. **Apoderado** crea y envía solicitud con documentos
2. **Secretaría** revisa documentos y pone en estado "En Revisión"
3. **Principal** revisa y aprueba la solicitud
4. **Apoderado** sube comprobante de pago
5. **Secretaría** valida el pago
6. **Admin** o **Secretaría** asigna paralelo
7. Estudiante queda **MATRICULADO**

### Escenario 2: Solicitud con Correcciones
1. **Apoderado** envía solicitud
2. **Secretaría** detecta error en cédula
3. **Secretaría** solicita corrección
4. **Apoderado** recibe notificación y corrige
5. **Secretaría** valida y envía a **Principal**
6. **Principal** aprueba

### Escenario 3: Configuración para Nuevo Colegio
1. **Superadmin** crea cuenta para nuevo colegio
2. **Admin del colegio** accede al configurador de formularios
3. Desactiva "Especialidad" (no aplica para su institución)
4. Modifica lista de grados según su oferta educativa
5. Agrega nuevos tipos de documentos requeridos
6. El formulario se adapta automáticamente para apoderados de ese colegio

---

## Resumen de Diferenciadores Clave

| Rol | Diferenciador Principal |
|-----|-------------------------|
| **Superadmin** | Control total: seguridad, sistema y usuarios admin |
| **Admin** | Gestión académica completa + configuración de formularios |
| **Principal** | Supervisión y aprobación (sin configuración) |
| **Secretary** | Operación diaria con módulos configurables |
| **Apoderado** | Acceso exclusivo a sus propias solicitudes |

---

## Beneficios de Escalabilidad

### Para Múltiples Colegios
- Un **Superadmin** gestiona múltiples instituciones
- Cada colegio tiene su propio **Admin** que personaliza:
  - Campos del formulario según sus necesidades
  - Opciones de grados y especialidades
  - Documentos requeridos
  - Flujos de aprobación

### Para Cambios Futuros
- Sin necesidad de modificar código:
  - Agregar nuevos grados (ej: Pre-kinder)
  - Cambiar especialidades de BGU
  - Modificar tipos de parentesco
  - Adaptar a nuevas políticas educativas

---

**Última actualización:** 9 de marzo de 2026
**Sistema:** SIAM UEFDB v3.2 (Demo Ready - Build 2026.03.09)
