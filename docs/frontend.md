# Documentacion del Frontend: cuestiones de UI/UX

El frontend de SIAM es una aplicacion React moderna construida sobre Next.js 14, optimizada para rendimiento y facilidad de uso.

## Caracteristicas de la Interfaz

### Diseño y Estilos
* El sistema utiliza Tailwind CSS para una interfaz responsive y moderna.
* Se implementa Shadcn/ui para garantizar consistencia en componentes como modales, selectores, tablas y botones.
* Soporte nativo para modo claro y oscuro, adaptable a las preferencias del sistema del usuario.

### Gestion de Sesiones (NextAuth.js)
Se utiliza NextAuth.js (v5 beta) para la gestion del lado del cliente:
* Proteccion de rutas mediante Middleware de Next.js.
* Gestion persistente del JWT de sesion.
* Sincronizacion de roles para mostrar u ocultar elementos de la interfaz segun los permisos del usuario.

### Formularios de Admision
El formulario de solicitud de admision es uno de los componentes mas complejos:
* Es multipaso (Stepper) para no abrumar al usuario.
* Implementa guardado progresivo (DRAFT) para evitar la perdida de informacion.
* Validacion rigurosa en tiempo real con Zod tanto en el cliente como en el servidor.
* Soporta la carga de archivos PDF e imagenes con previsualizacion.

## Arquitectura de Paginas

* `/`: Pagina de inicio con informacion general del sistema y accesos directos.
* `/login`: Formulario de acceso con carrusel informativo.
* `/dashboard`: Panel principal personalizado segun el rol del usuario.
* `/admin/*`: Seccion exclusiva para personal administrativo (Admisiones, Usuarios, Reportes, Cupos).
* `/apoderado/*`: Seccion para padres de familia donde gestionan sus solicitudes.
* `/perfil`: Edicion de datos personales y cambio de contraseña.

## Biblioteca de Componentes

Los componentes se organizan de forma modular:
* `ui/`: Componentes base (Botones, Inputs, Dialogs).
* `layout/`: Componentes de estructura (Sidebar, Navbar, Footer).
* `auth/`: Componentes relacionados con el flujo de inicio de sesion y registro.
* `application-form/`: Todo lo referente a la solicitud de ingreso.