# Pantalla de inicio

GET /api/inicio requiere sesión y rol ADMINISTRADOR, VENDEDOR o ALMACENERO. Usa una consulta de solo lectura con snapshot único. Sin nuevas migraciones.

Incluye productos activos, productos con stock vendible menor o igual al mínimo, lotes disponibles vencidos con stock y lotes disponibles con stock que vencen desde hoy hasta 30 días inclusive. Solo considera productos activos. La ventana de 30 días es un criterio inicial visible en la interfaz, pendiente de aprobación del SRS. Lista hasta cinco lotes por fecha e ID.

Ventas confirmadas del día en America/Lima: administrador ve todas, vendedor solo propias; almacenero recibe sales=null. Importes decimales se envían como texto y se muestran en soles (PEN), supuesto de presentación pendiente de confirmar si se amplía a otras monedas. Las operaciones comerciales continúan pendientes.

La pantalla carga al entrar y permite actualización manual, con timeout de 15 segundos, mensajes de error y conservación explícita del último resultado si falla una actualización. No existe actualización en tiempo real. La fecha del navegador y la fecha de los datos pueden diferir si el reloj del equipo está desajustado; el resumen se calcula en el servidor.

Archivos: frontend/src/features/inicio/pages e implementación Spring MVC en backend/src/main/java/com/novasalud/modules/inicio. El usuario autenticado llega al inicio mediante el contexto del Outlet. Accesos respetan la navegación por rol y anuncian que los módulos siguen en preparación.

Validación: npm run inicio:test verifica stock, vencimientos y privacidad con PostgreSQL temporal de Testcontainers. Revisión visual de escritorio/móvil y ambos temas. Sin datos comerciales ficticios persistidos.
