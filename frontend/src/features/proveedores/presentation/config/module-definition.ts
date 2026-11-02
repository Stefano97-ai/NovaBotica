import type { ModuleDefinition } from '../../../../shared/presentation/components/DraftModule';
export const definition: ModuleDefinition = {
  "key": "proveedores",
  "title": "Proveedores",
  "description": "Organiza los datos comerciales y los contactos de abastecimiento.",
  "singular": "proveedor",
  "note": "Los borradores no verifican el RUC ni consultan registros externos. Revisa los datos antes de su futura incorporación.",
  "fields": [
    {
      "key": "ruc",
      "label": "RUC",
      "required": true,
      "pattern": "^[0-9]{11}$",
      "hint": "11 dígitos, sin espacios."
    },
    {
      "key": "razon",
      "label": "Razón social",
      "required": true
    },
    {
      "key": "contacto",
      "label": "Persona de contacto",
      "required": false
    },
    {
      "key": "telefono",
      "label": "Teléfono",
      "required": true,
      "pattern": "^[+0-9 ()-]{7,20}$"
    },
    {
      "key": "correo",
      "label": "Correo",
      "required": false,
      "kind": "email"
    },
    {
      "key": "direccion",
      "label": "Dirección",
      "required": true
    },
    {
      "key": "estado",
      "label": "Estado",
      "required": true,
      "options": [
        "Activo",
        "Inactivo"
      ]
    }
  ],
  "columns": [
    "razon",
    "ruc",
    "telefono",
    "correo",
    "estado"
  ],
  "filterKey": "estado"
};
