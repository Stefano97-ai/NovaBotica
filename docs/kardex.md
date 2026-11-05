# Kardex real por lote

La ruta `/inventario/kardex` consulta exclusivamente la base de datos mediante `/api/inventario/kardex`. Su nueva vista no utiliza los ejemplos ni los cálculos de saldo fijo de la pantalla antigua. Las demás vistas de inventario conservan su alcance previo.

Cada fila identifica producto, lote, responsable, referencia, motivo y fecha en **America/Lima**. Las cantidades positivas son entradas; las negativas, salidas, incluidos los ajustes. Los saldos pertenecen al lote, nunca a una suma de productos distintos.

## Saldos

- Se respetan `movimiento.saldo_anterior` y `saldo_posterior` cuando existen.
- Para un histórico sin esos campos, se reconstruye desde cero únicamente si todos los movimientos del lote, ordenados por fecha e ID, permanecen no negativos y su suma coincide con `lote.stock_actual`.
- Si el histórico no puede conciliarse, se muestran sus cantidades reales y **No verificable** en los saldos. No se altera el historial ni el stock para forzar una coincidencia.
- Las ventanas de cálculo ven todo el historial antes de aplicar filtros o paginación. Una consulta de un solo día o una página posterior no reinicia el saldo.

## Consulta y exportación

Los roles administrador, almacenero y vendedor autenticados pueden consultar. Parámetros opcionales:

`productoId`, `loteId`, `desde`, `hasta`, `tipo` (`ENTRADA`, `SALIDA`, `AJUSTE`), `origen` (`VENTA`, `RECEPCION_LOTE`, `MANUAL`), `usuarioId`, `referencia`, `limit` (1–100), `offset`.

`desde` incluye el inicio del día de Lima; `hasta` incluye todo su día. La referencia busca texto literal en referencia, motivo y número del origen. Los filtros se combinan con AND. Una combinación producto/lote incompatible devuelve cero filas.

`/opciones` devuelve productos reales y lotes/responsables que tienen movimientos, incluidos registros inactivos con historia. El selector de producto permite buscar por código o nombre. Los filtros se aplican con **Consultar**; exportación y tabla usan la última consulta aplicada.

`/exportar` genera CSV de todos los resultados filtrados, independientemente de la página (máximo 100000 filas; si se supera, solicita acotar los filtros). Usa BOM UTF-8, comillas y escape de fórmulas. La impresión está rotulada **Imprimir página**.

Validaciones: `KardexIntegrationTest` comprueba separación de lotes/productos, orden estable, ajustes negativos, límites horarios de Lima, saldo al filtrar/paginar, históricos no conciliables, filtros combinados, exportación, autenticación y parámetros inválidos.
