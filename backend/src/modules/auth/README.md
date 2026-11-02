# Auth

Autenticación implementada mediante controlador HTTP, servicio, repositorio PostgreSQL y guard global. `password.ts` encapsula scrypt. `auth.types.ts` define sesión y roles.

Los controladores validan las entradas; el servicio coordina sesiones y límites; el repositorio ejecuta SQL y transacciones. Los endpoints de negocio requieren sesión por defecto. Usar `Roles` para sus permisos explícitos y `Public` solamente para recursos públicos deliberados.

Consultar `docs/login.md` desde la raíz para configuración, pruebas y alcance.
