import type { ModuleDefinition } from '../../../../shared/presentation/components/DraftModule';
export const definition: ModuleDefinition = {
  "key": "compras",
  "title": "Compras",
  "description": "Prepara la recepción de mercadería antes de registrar una compra.",
  "singular": "recepción",
  "note": "Cada borrador representa una línea de recepción. No crea compras, pagos ni movimientos de inventario.",
  "fields": [
    {
      "key": "proveedor",
      "label": "RUC del proveedor",
      "required": true,
      "pattern": "^[0-9]{11}$"
    },
    {
      "key": "documento",
      "label": "Documento de referencia",
      "required": true
    },
    {
      "key": "producto",
      "label": "Código de producto",
      "required": true
    },
    {
      "key": "lote",
      "label": "Lote recibido",
      "required": true
    },
    {
      "key": "vence",
      "label": "Vencimiento",
      "required": true,
      "kind": "date"
    },
    {
      "key": "cantidad",
      "label": "Unidades recibidas",
      "required": true,
      "kind": "number",
      "min": 1,
      "integer": true
    },
    {
      "key": "costo",
      "label": "Costo unitario (S/)",
      "required": true,
      "kind": "number",
      "min": 0,
      "integer": false
    },
    {
      "key": "condicion",
      "label": "Condición de pago",
      "required": true,
      "options": [
        "Contado",
        "Crédito"
      ]
    }
  ],
  "columns": [
    "documento",
    "proveedor",
    "producto",
    "cantidad",
    "costo"
  ],
  "filterKey": "condicion"
};
