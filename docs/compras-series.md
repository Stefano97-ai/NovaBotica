# Series únicas en compras

El formulario de Compras consulta productos, categorías y proveedores reales. Crear un producto guarda `requiereSerie` en el catálogo. La compra comienza vacía; el costo se introduce por línea y no se infiere del precio de venta.

Para un producto marcado con serie única, **Series N/cantidad** abre una ventana que admite una serie por línea (también pegar o escanear). Se exige una serie diferente por unidad antes de recibir la compra. Cambiar la cantidad conserva las series anteriores y exige revisarlas; no se eliminan silenciosamente.

`POST /api/compras/registro` requiere administrador o almacenero y recibe:

```json
{
  "proveedorId": 1,
  "items": [{
    "productoId": 1,
    "cantidad": 2,
    "costoUnitario": 15,
    "numeroLote": "L-2026-01",
    "fechaVencimiento": "2028-11-01",
    "series": ["SN-001", "SN-002"]
  }]
}
```

La operación crea la orden, recibe todas sus líneas y registra `unidad_serializada` con sus vínculos a producto, lote y detalle de compra en una transacción. Reutiliza las tablas existentes, sin migración adicional. Rechaza productos inactivos, líneas de producto repetidas, series duplicadas o existentes y cantidades de series diferentes a las unidades. Un error revierte orden, recepción, stock, movimientos y series. Los bloqueos de producto siguen el mismo orden que en ventas.

La creación del producto es independiente: cancelar la compra no elimina un producto que ya se creó. Los endpoints anteriores de órdenes pendientes y recepción parcial conservan su contrato. La selección de series al vender sigue siendo opcional.

Alcance: los datos de serie/correlativo del documento del proveedor, condiciones de pago, descuentos y observaciones de la pantalla antigua no están incorporados al contrato de compra actual. Este cambio persiste proveedor, productos, cantidades, costos, lotes, vencimientos y series. El total de la API continúa siendo la suma de cantidad por costo unitario.

Validación: `CompraSeriesIntegrationTest` verifica vínculos, conteos, rollback, permisos y persistencia del indicador. `frontend/tests/compras-series.test.mjs` cubre cantidades, espacios, duplicados y cambios de cantidad.
