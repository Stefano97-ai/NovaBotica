import type { ModuleDefinition } from '../../../../shared/presentation/components/DraftModule';
export const definition: ModuleDefinition = {
  "key": "comprobantes",
  "title": "Comprobantes",
  "description": "Prepara los datos para la futura facturación simulada.",
  "singular": "solicitud de comprobante",
  "note": "No se emiten comprobantes ni numeraciones fiscales. Estos borradores no tienen validez tributaria ni se envían a SUNAT.",
  "fields": [
    {
      "key": "venta",
      "label": "Referencia de venta",
      "required": true
    },
    {
      "key": "tipo",
      "label": "Tipo",
      "required": true,
      "options": [
        "Boleta simulada",
        "Factura simulada"
      ]
    },
    {
      "key": "cliente",
      "label": "Nombre o razón social",
      "required": true
    },
    {
      "key": "documento",
      "label": "Documento del cliente",
      "required": true,
      "pattern": "^([0-9]{8}|[0-9]{11})$",
      "hint": "DNI de 8 dígitos o RUC de 11 dígitos."
    },
    {
      "key": "direccion",
      "label": "Dirección",
      "required": false
    },
    {
      "key": "correo",
      "label": "Correo de contacto",
      "required": false,
      "kind": "email"
    }
  ],
  "columns": [
    "venta",
    "tipo",
    "cliente",
    "documento"
  ],
  "filterKey": "tipo"
};
