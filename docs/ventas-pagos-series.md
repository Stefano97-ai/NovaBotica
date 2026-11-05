# Ventas: documentos, pagos y series opcionales

La pantalla `/ventas` inicia en boleta, con cliente sin documento. Para boleta se permite sin documento, DNI o CE; RUC no se ofrece. Factura fija RUC y bloquea el selector. Se admiten enlaces de inicio `?tipo=FACTURA`. El backend valida que una factura tenga un cliente RUC y que una boleta no use un cliente RUC. Los clientes identificados se buscan o crean antes de registrar la venta; la creación de un cliente es independiente de la transacción comercial.

`Agregar Pago` añade filas con método, monto y referencia opcional. Cada fila se envía en `pagos` a la API existente. Se puede eliminar cualquier fila adicional. La pantalla valida montos positivos con dos decimales y una distribución exacta del total; muestra saldo pendiente o exceso. Un cambio del carrito conserva las primeras asignaciones y recalcula la última. La calculadora de efectivo/vuelto es independiente de los montos asignados. Se evita doble envío y se conserva la clave de idempotencia al reintentar el mismo contenido; un rechazo nunca muestra un comprobante exitoso ni vacía el carrito.

## Catálogo y series

Migración aditiva `004_ventas_series_documentos.sql`: añade `producto.requiere_serie boolean NOT NULL DEFAULT false`. Se expone como `requiereSerie` en los DTO de producto y en crear/actualizar producto. El nombre indica que el producto utiliza seguimiento por serie: por requerimiento del usuario, **no obliga a elegir series para venderlo**. Productos que ya tienen unidades serializadas quedan marcados al migrar. No se inventan números de serie para existencias anteriores.

Los productos marcados muestran un botón de series junto a eliminar en cada línea del carrito. El diálogo permite buscar por número o lote, seleccionar hasta una serie por unidad y limpiar la selección. Admite selección vacía y parcial. Las series de lotes posteriores a la asignación FEFO aparecen deshabilitadas; si cambia la cantidad, el stock o la disponibilidad, el servidor vuelve a validar antes de confirmar.

- `GET /api/productos/{id}/series?cantidad=2`: lista las unidades DISPONIBLE de lotes vigentes y disponibles, con `limiteLote` según FEFO. Roles administrador, vendedor y almacenero.
- `POST /api/productos/{id}/series`: registra una unidad con `loteId`, `detalleCompraId`, `numeroSerie` y `codigoEscaneado` opcional. Administrador o almacenero. Requiere una recepción asociada a ese detalle y lote, stock vigente y capacidad disponible. Marca el producto para seguimiento por serie. El registro de nuevas series se ofrece mediante API; este cambio no implementa una pantalla de recepción/registro de series.
- `POST /api/ventas`: cada ítem puede incluir `unidadesSerializadas: [id, ...]`, omitido, nulo o vacío. Las series elegidas se enlazan con `detalle_venta_lote` y pasan a VENDIDA en la misma transacción que stock, movimientos, pagos y comprobante. Los detalles de respuesta incluyen `series` con ID y número.

Se bloquean los productos en orden de ID durante ventas, registro de series y anulación, y las series se bloquean al asignarlas. Se rechazan series repetidas, vendidas, ajenas al producto, cantidades excesivas o lotes fuera de FEFO. Cualquier error revierte la venta completa. La anulación libera las series seleccionadas y devuelve stock. Las unidades vendidas sin indicar serie no se asignan ficticiamente a un número: el stock se descuenta por FEFO y las series registradas permanecen sin identificación de esa salida, consecuencia del seguimiento opcional solicitado.

Los números de serie deben registrarse a partir de unidades físicas reales. Cambiar `requiereSerie` no genera unidades, stock ni seriales. La migración también amplía los clientes CE a identificadores alfanuméricos de 6 a 11 caracteres, conservando DNI/RUC anteriores.

Para el catálogo de demostración existe la carga opcional `scripts/database/seed-demo-series.sql`: añade únicamente `DEMO-TERM-001` a `DEMO-TERM-003` al termómetro `DEMO-NS-023`, marca ese producto y no modifica existencias. Estos identificadores son ficticios y no deben confundirse con números de equipos físicos. La carga es transaccional y no duplica series al repetirse.

## Validación

```powershell
node --test frontend/tests/ventas-totals.test.mjs frontend/tests/ventas-payments-series.test.mjs
mvn -B -f backend/pom.xml -Dtest=VentaSeriesIntegrationTest,InicioChartsIntegrationTest,FefoServiceTest test
```

Las pruebas de integración usan PostgreSQL 18 temporal y cubren pagos fraccionados, documentos, series vacías/parciales, duplicadas y no FEFO, rollback integral, idempotencia, liberación por anulación, permisos y dos ventas concurrentes de la misma unidad.
