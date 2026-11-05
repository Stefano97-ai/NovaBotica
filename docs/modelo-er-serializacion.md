# Adecuación al diagrama ER: migración 003

Se conserva la nomenclatura y compatibilidad de la aplicación, según la decisión del equipo. La migración es aditiva; `001_initial.sql` y `002_auth.sql` no se modifican. No se cambian identificadores, contraseñas, ventas ni existencias. Se conservan `bigint`, `timestamptz`, restricciones, idempotencia, sesiones y recepciones parciales existentes.

## Correspondencia de nombres

| Diagrama | Base actual |
| --- | --- |
| `id_rol`, `id_usuario`, `id_producto`, etc. como PK | `id` en cada tabla |
| `id_categoria`, `id_cliente`, `id_usuario`, etc. como FK | `categoria_id`, `cliente_id`, `usuario_id`, etc. |
| `id_tipo` en serie | `tipo_comprobante_id` |
| `id_serie` en comprobante | `serie_comprobante_id` |
| `id_asignacion` en detalle_venta_lote | `id` |
| `id_unidad` en unidad_serializada | `id` |
| `id_asignacion` en unidad_serializada | `asignacion_id` |

## Campos incorporados

- `producto.presentacion`: alias calculado de `unidad_base`, que representa la presentación actual del catálogo. No son dos valores independientes. Una descripción comercial adicional requeriría ampliar explícitamente el contrato del catálogo.
- `detalle_compra.subtotal`: calculado como cantidad por costo unitario, en `numeric(24,2)` para evitar desbordar al multiplicar.
- `venta.igv`: alias calculado de `impuesto`.
- `tipo_comprobante.codigo_sunat`: `01` para FACTURA y `03` para BOLETA; NULL para la nota de venta interna. Formato de dos dígitos y unicidad cuando tiene valor. No habilita emisión fiscal.
- `comprobante.fecha_emision`: alias de la fecha de creación de la solicitud simulada; no acredita una emisión tributaria. `modo_emision` se calcula desde `simulado`, manteniendo la restricción de emisión simulada de la base actual.
- `movimiento.tipo_movimiento`: alias de `tipo`. `origen_tipo` y `origen_id` se calculan desde las referencias existentes a venta y recepción. Los movimientos manuales tienen origen MANUAL y origen_id NULL; no se inventan claves polimórficas sin relación real.
- `movimiento.saldo_anterior` y `saldo_posterior`: ambos nulos o ambos coherentes, no negativos y relacionados por la cantidad con signo. El backend captura los nuevos saldos desde el lote administrado por JPA, antes de insertar el movimiento, sin depender del orden del flush.

Los saldos antiguos se reconstruyen solamente cuando el libro de movimientos parte de cero, nunca es negativo y su suma concuerda con `stock_actual`. Un histórico incompleto conserva NULL en sus saldos; NULL significa desconocido, no cero.

## Unidad serializada

`unidad_serializada` enlaza un lote con el detalle de compra que registró la unidad y, opcionalmente, una asignación de `detalle_venta_lote`.

- `numero_serie` es obligatorio, no admite espacios exteriores y es único globalmente.
- `codigo_escaneado` es opcional. No se declara único porque el diagrama solo marca la serie como UK.
- Estados definidos para esta implementación: DISPONIBLE, VENDIDA y BAJA. VENDIDA requiere asignación, y una unidad con asignación debe estar VENDIDA.
- `producto_id` es una clave técnica adicional, derivada del lote por trigger. Las claves foráneas compuestas impiden relacionar la compra de un producto con el lote de otro o asignar una unidad a otro lote.
- Los vínculos de origen lote/compra son inmutables. No hay cascadas de borrado de historia.
- Los registros serializados no pueden superar las unidades compradas ni las asignadas a la venta. Los padres se bloquean antes del conteo y no pueden reducir su cantidad por debajo del número vinculado.

La serialización es opcional y **no crea unidades ficticias para el stock existente**, no modifica `stock_actual` ni reemplaza FEFO. Esta etapa prepara el esquema; aún no incorpora formularios, endpoints de escaneo, asignación automática de números de serie ni devolución de unidades serializadas. Antes de activarlos, sus casos de uso deberán actualizar stock, movimientos, estado y asignación en una sola transacción. Las operaciones existentes continúan manejando stock por lote sin serializarlo automáticamente.

## Validación y operación

1. Respaldo PostgreSQL en formato custom antes de aplicar cambios, dentro de `.local/` (ignorado por Git).
2. Restauración en una base aislada y ejecución transaccional de 003.
3. `backend/database/tests/003_modelo_er_serializacion.sql` verifica alias, series duplicadas, cruces de producto/lote, capacidades, estado y saldos. Los datos de prueba se revierten al terminar.
4. Pruebas Java de saldo antes del flush, autenticación, migraciones repetidas y FEFO.
5. Despliegue mediante el ejecutor de migraciones de la aplicación, conservando su checksum y bloqueo de migración.

La reversión de una instancia con datos nuevos requiere restaurar el respaldo o diseñar una migración inversa que conserve las unidades serializadas. No borrar columnas o tablas manualmente en la instancia activa.
