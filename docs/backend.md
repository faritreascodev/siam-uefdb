# Documentacion del Backend: API y Persistencia

El backend de SIAM gestiona la logica de negocio, el almacenamiento de datos y la seguridad mediante una arquitectura modular en NestJS.

## Modulos Principales

El sistema se divide en modulos independientes para facilitar el mantenimiento:

* Auth: Gestion de registro, inicio de sesion y generacion de JWT. Implementa el flujo de aprobacion para nuevos usuarios.
* Users: Gestion de perfiles y usuarios del sistema.
* Applications: Nucleo del sistema. Gestiona el ciclo de vida de las solicitudes de admision (DRAFT -> SUBMITTED -> UNDER_REVIEW -> ... -> MATRICULATED).
* Quotas: Sistema de gestion de cupos por jornada y nivel academivo.
* Reports: Generacion de reportes PDF dinámicos utilizando Puppeteer.
* Notifications: Sistema de notificaciones internas para informar sobre cambios en las solicitudes.
* External-apis: Integracion con servicios externos de verificacion (simulado).
* Extra-contacts: Modulo para gestionar contactos de emergencia adicionales por solicitud.

## Base de Datos (Prisma)

Se utiliza PostgreSQL como base de datos relacional. El esquema define las siguientes entidades clave:

* User: Almacena credenciales (hasheadas con bcrypt) y datos personales.
* Role: Define los privilegios dentro del sistema.
* Application: Entidad principal que centraliza toda la informacion del estudiante, documentos y observaciones administrativas.
* ApplicationDocument: Referencia a los archivos cargados para cada solicitud.
* AdmissionQuota: Registro de capacidad disponible por niveles.
* PasswordRecoveryRequest: Gestiona las solicitudes de restablecimiento de contraseña.

## Flujo de Autenticacion

1. El usuario envia sus credenciales al endpoint `/auth/login`.
2. El servidor valida el hash de la contraseña y si la cuenta esta aprobada.
3. Se firma un JWT con una duracion personalizada definido en las variables de entorno.
4. El cliente incluye este token en el encabezado `Authorization: Bearer <token>` para cada peticion protegida.

## Generacion de Reportes PDF

El backend utiliza Puppeteer para renderizar plantillas HTML y convertirlas a PDF. Esto permite generar documentos de alta calidad para las solicitudes de ingreso, incluyendo codigos de barras o sellos digitales si fuera necesario.