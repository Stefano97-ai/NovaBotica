# Pantalla de inicio

GET /api/inicio requiere sesión y rol ADMINISTRADOR, VENDEDOR o ALMACENERO. Usa una consulta de solo lectura con snapshot único. Sin nuevas migraciones.

Incluye productos activos, productos con stock vendible menor o igual al mínimo, lotes disponibles vencidos con stock y lotes disponibles con stock que vencen desde hoy hasta 30 días inclusive. Solo considera productos activos. La ventana de 30 días es un criterio inicial visible en la interfaz, pendiente de aprobación del SRS. Lista hasta cinco lotes por fecha e ID.

Ventas confirmadas del día en America/Lima: administrador ve todas, vendedor solo propias; almacenero recibe sales=null. Importes decimales se envían como texto y se muestran en soles (PEN), supuesto de presentación pendiente de confirmar si se amplía a otras monedas. Las operaciones comerciales continúan pendientes.

La pantalla carga al entrar y permite actualización manual, con timeout de 15 segundos, mensajes de error y conservación explícita del último resultado si falla una actualización. No existe actualización en tiempo real. La fecha del navegador y la fecha de los datos pueden diferir si el reloj del equipo está desajustado; el resumen se calcula en el servidor.

Archivos: frontend/src/features/inicio/pages e implementación Spring MVC en backend/src/main/java/com/novasalud/inicio. El usuario autenticado llega al inicio mediante el contexto del Outlet. Accesos respetan la navegación por rol y anuncian que los módulos siguen en preparación.

Validación: npm run inicio:test verifica stock, vencimientos y privacidad con PostgreSQL temporal de Testcontainers. Revisión visual de escritorio/móvil y ambos temas. Sin datos comerciales ficticios persistidos.

## Gráficos funcionales

`GET /api/inicio/graficos?days=30` requiere sesión. Acepta solamente 7, 30 o 90 días (400 para otros valores); incluye hoy y los días anteriores hasta completar el período, con límites y horas en `America/Lima`. Una consulta de solo lectura genera todas las series con el mismo snapshot, sin migraciones ni escrituras comerciales.

Orden de visualización:

1. Evolución de ventas: importe diario de ventas confirmadas, incluyendo días sin operaciones en cero.
2. Top 5 productos más vendidos: unidades vendidas, desempate por importe e ID.
3. Ventas por hora: cantidad de operaciones confirmadas, acumulada por hora durante el período; tabla con importes por hora.
4. Ventas por categoría: total de los detalles, incluidos impuestos, agrupado por la categoría actual del producto. Incluye todas las categorías con ventas; la lista tiene desplazamiento cuando es extensa.
5. Productos con stock crítico: hasta cinco productos activos con stock vendible menor o igual al mínimo, ordenados por faltante descendente. Disponible excluye lotes vencidos/no disponibles; se compara con el mínimo configurado. Un producto sin existencias y mínimo cero permanece visible.
6. Vencimientos próximos: unidades y cantidad de lotes disponibles con stock positivo de productos activos, agrupados en 0–30, 31–60 y 61–90 días, sin solapamiento y con extremos incluidos.

Las cuatro series de ventas respetan la misma privacidad del resumen: administrador ve todas, vendedor solo propias y almacenero recibe `sales=null` y visualiza únicamente los gráficos de inventario. No se descartan ventas históricas de productos actualmente inactivos. Los importes se transportan como texto decimal.

El selector modifica solamente el período de ventas; los dos gráficos de inventario muestran la situación actual. Actualizar recarga resumen y gráficos. Cada gráfico ofrece una tabla accesible con valores exactos, estados de carga y ausencia de datos. Si falla una actualización del mismo período se conserva el resultado anterior; al fallar un cambio de período no se muestran datos antiguos con una etiqueta nueva. No hay actualización automática en tiempo real.

Frontend: contrato en `domain/inicio-charts.ts`, puerto en `application/inicio-charts-port.ts`, adaptador HTTP en `infrastructure/inicio-charts-api.ts` y hook/componentes en `presentation`. La página existente compone estas dependencias. Backend conserva controller/service/repository por módulo.

Pruebas específicas: `mvn -B -f backend/pom.xml -Dtest=InicioChartsIntegrationTest test`. Usan PostgreSQL 18 temporal de Testcontainers y transacciones revertidas, con comprobaciones de agregados, anulaciones, límites de fecha/hora, permisos, períodos, stock y límites de vencimiento.
