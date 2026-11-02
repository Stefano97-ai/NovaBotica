import type { ModuleDefinition } from '../../../../shared/presentation/components/DraftModule';
export const definition: ModuleDefinition = {
  "key": "inventario",
  "title": "Inventario",
  "description": "Prepara el registro de lotes y revisa su fecha de vencimiento.",
  "singular": "lote",
  "note": "FEFO prioriza el lote vendible que vence primero. Estos borradores no asignan stock ni permiten vender lotes vencidos; la validación definitiva corresponde al servidor.",
  "fields": [
    {
      "key": "producto",
      "label": "Código de producto",
      "required": true
    },
    {
      "key": "lote",
      "label": "Número de lote",
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
      "label": "Unidades",
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
      "key": "ubicacion",
      "label": "Ubicación",
      "required": false
    },
    {
      "key": "estado",
      "label": "Condición",
      "required": true,
      "options": [
        "Disponible",
        "En cuarentena",
        "Dañado"
      ]
    }
  ],
  "columns": [
    "producto",
    "lote",
    "vence",
    "cantidad",
    "estado"
  ],
  "filterKey": "estado"
};
