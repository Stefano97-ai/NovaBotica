# Continuidad para el siguiente equipo

## Punto de partida

Trabajar desde `develop`, siguiendo el primer arranque del README. Esta entrega incorpora autenticación y la interfaz de acceso con temas claro/oscuro. La base y los módulos iniciales ya estaban disponibles; los procesos comerciales aún no están implementados.

El PDF SRS original no está versionado en este repositorio. Solicitar al responsable del proyecto su versión vigente y contrastarla con la trazabilidad RF de arquitectura.md antes de cerrar criterios de aceptación. Esa tabla es una guía del análisis previo, no reemplaza al documento original.

## Mapa para orientarse

| Área | Punto de entrada | Estado |
|---|---|---|
| Login | frontend/src/features/auth/pages/login.page.tsx | Funcional, validación y errores accesibles |
| Cliente de autenticación | frontend/src/features/auth/api/auth.ts | Cookie del mismo origen, timeout, mensajes |
| Navegación | frontend/src/app/router.tsx | Sesión, redirecciones y visibilidad por rol |
| Tema | frontend/src/shared/components/ThemeToggle.tsx y frontend/index.html | Preferencia local, valor inicial del sistema, evita destello |
| API auth | backend/src/modules/auth/ | Controller, service, repository, guard, scrypt |
| Persistencia | backend/src/shared/database/ | Pool y transacción compartida |
| Migraciones | backend/database/migrations/ | 001 negocio; 002 sesiones y límites |
| Otros módulos | backend/src/modules/ y frontend/src/features/ | Estructura inicial, sin casos comerciales |

## Siguiente entrega recomendada

1. Confirmar matriz de permisos con responsables y SRS. Implementar administración de cuentas, activación y cambio/restablecimiento de contraseña autorizado. Actualmente no hay interfaz ni flujo de recuperación; el enlace del login solo indica contactar al administrador.
2. Implementar catálogo y proveedores con validación de DTO, permisos explícitos del servidor y pruebas de integración.
3. Implementar compras, recepción parcial, lotes y movimientos en una única transacción. Acordar unidades y conversiones antes de guardar cantidades.
4. Implementar venta con FEFO, bloqueo concurrente, idempotencia, pagos y rollback total. Usar los escenarios de arquitectura.md como criterios, no asumir que las restricciones SQL ya resuelven el flujo.
5. Comprobantes simulados, correlativo único, PDF posterior al commit y reintentos por comprobante. Luego alertas y reportes.

## Decisiones por confirmar

- Matriz CRUD por rol; la navegación actual es una distribución inicial, no aprobación funcional definitiva.
- Unidad base y conversiones caja/blíster/tableta; hoy el esquema usa cantidades enteras.
- Impuestos y precios incluidos/excluidos, descuentos, anulaciones y excepciones de pago.
- Umbrales y ventanas de alertas; restricciones de clientes por comprobante.
- Entorno productivo, dominio/origen, política de cuentas, respaldos y ensayo de restauración.

## Particularidades de autenticación

Sesiones de 8 horas sin renovación automática. Cada petición protegida consulta sesión y usuario activo. Desactivar una cuenta impide acceso, pero reactivarla puede volver a habilitar una sesión aún vigente: definir revocación explícita al implementar administración de usuarios. Cerrar sesión revoca el token del navegador; no existe todavía cierre global de sesiones.

Los límites por usuario/IP incluyen intentos exitosos. Revisar identificación de IP si se agrega un proxy; no confiar en cabeceras arbitrarias. El guard exige sesión por defecto, pero los permisos específicos de un endpoint deben declararse mediante Roles. Los endpoints health son públicos. Ver login.md para cookies, orígenes y ejemplos de operación.

## Evidencia de esta entrega

Compilación y revisión TypeScript, integración PostgreSQL y autenticación. Revisión visual del login claro/oscuro en escritorio y móvil; cambio y persistencia de tema, ingreso, recarga, cierre, rutas privadas, errores de conexión y movimiento reducido comprobados en navegador. No existe aún una suite E2E de navegador versionada ni CI configurada: son próximos trabajos de infraestructura.

No se verificaron flujos de ventas, FEFO, compras o PDF porque todavía no existen. La auditoría de dependencias registrada en base-de-datos.md es histórica; repetirla al preparar un despliegue.

## Entrega y datos

El repositorio incluye código, migraciones, lockfile e imagen local. Excluye credenciales, cuentas/datos de la instancia local, registros, capturas y compilados. No trasladar `.local/postgres-data` entre equipos; generar una instancia o usar un respaldo aprobado con pg_dump/pg_restore. No modificar el checksum de migraciones aplicadas.

## Avance posterior: inicio

La pantalla de inicio ya muestra datos reales y alertas calculadas mediante GET /api/inicio. Ver [inicio.md](inicio.md). Los módulos de operación comercial continúan pendientes; no se registran ventas ni movimientos desde el panel.
