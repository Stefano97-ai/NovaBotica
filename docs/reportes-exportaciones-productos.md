# Reportes, exportaciones e imágenes de productos

## Reportes reales

`GET /api/reportes/detalle?tipo=ventas|compras|inventario|vencimientos&desde=YYYY-MM-DD&hasta=YYYY-MM-DD` está restringido a administrador. La pantalla dejó de usar datos de ejemplo. Las fechas de operaciones se evalúan en America/Lima, con el día final incluido.

Hoy usa la fecha de Lima; Semana va desde el lunes hasta hoy; Este mes desde el primer día hasta hoy; Año desde el 1 de enero hasta hoy. Cambiar fechas manualmente desmarca el período rápido. Búsqueda y tipo/estado se combinan con el período y actualizan tabla, indicadores y exportación.

Ventas incluye operaciones confirmadas una sola vez, con métodos fraccionados juntos. Compras muestra órdenes reales y excluye anuladas de inversión. No se inventan utilidades ni condiciones de crédito. Inventario usa existencias actuales y aplica el período a ventas y clasificación ABC (80/15/5 % de ingresos base). Vencimientos aplica el rango a fecha de vencimiento; conserva solo lotes disponibles con stock de productos activos.

## Exportaciones

Reportes y Kardex comparten `ExportButtons`, el mismo dock oscuro y botones rojo para PDF y verde para Excel. Se retiraron sus botones de impresión. Se generan documentos `.pdf` y `.xlsx` reales, con cabecera, contexto de consulta y todas las filas filtradas (no solo la página visible). Excel conserva valores numéricos, formato monetario y encabezado fijo; el texto que parece fórmula se mantiene como texto literal.

La generación se carga solo al exportar. Kardex obtiene todos los resultados desde `/api/inventario/kardex/datos-exportacion`, conservando los cálculos y filtros del servidor. Límite de exportación: 100000 filas. Los errores no se presentan como descargas exitosas.

## Productos

Administrar productos carga solo el catálogo real. Editar y activar/desactivar usan la API y requieren administrador. El botón Kardex navega con `productoId`. SKU y stock son de consulta en la edición; las existencias se modifican mediante operaciones de inventario trazables. Se permite editar el indicador de serie única.

`POST /api/productos/{id}/edicion` recibe multipart `datos` (JSON UpdateProductoDto) y `imagen` opcional. Guarda datos e imagen en una sola transacción. Admite PNG/JPEG de hasta 2 MB, dimensiones hasta 16 megapíxeles (6000 píxeles por lado), normaliza a PNG de hasta 1200 píxeles y descarta metadatos originales.

Migración aditiva `006_producto_imagen.sql`: `producto.imagen_version` y tabla `producto_imagen` con contenido binario y FK a producto. La imagen persiste en PostgreSQL y sobrevive reconstrucciones de contenedores. `imagenUrl` cambia de versión al sustituir la imagen. Lectura autenticada por `/api/productos/{id}/imagen`; las tarjetas de Ventas muestran la imagen asignada o el SVG predeterminado de Nova Salud.

## Compras

Se retiró completamente el campo de descuento, su estado, la resta del cálculo y la línea del resumen. El total de pantalla se calcula con cantidades, costo e IGV sin descuentos.

## Validación

- `ReportesProductosIntegrationTest`: fechas de Lima, reportes reales, permisos, edición/imagen atómicas, archivo inválido, tamaño, lectura persistida y activación.
- `frontend/tests/reports-exports.test.mjs`: períodos, filtros, PDF y XLSX reales con filas e importes comprobados.
- Se mantienen las pruebas de compras con series y Kardex.
