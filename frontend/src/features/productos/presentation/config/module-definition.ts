import type { ModuleDefinition } from '../../../../shared/presentation/components/DraftModule';
export const definition: ModuleDefinition = {
  "key": "productos",
  "title": "Productos",
  "description": "Organiza el catálogo, las presentaciones y los precios de tu botica.",
  "singular": "producto",
  "note": "Preparar un producto no crea existencias. El código y los precios se validarán contra el catálogo al conectar el registro.",
  "fields": [
    {
      "key": "codigo",
      "label": "Código interno",
      "required": true
    },
    {
      "key": "nombre",
      "label": "Nombre del producto",
      "required": true
    },
    {
      "key": "principio",
      "label": "Principio activo",
      "required": false
    },
    {
      "key": "presentacion",
      "label": "Presentación",
      "required": true,
      "hint": "Ejemplo de formato: caja de 20 tabletas."
    },
    {
      "key": "categoria",
      "label": "Categoría",
      "required": true,
      "options": [
        "Medicamento",
        "Cuidado personal",
        "Material médico",
        "Otro"
      ]
    },
    {
      "key": "precio",
      "label": "Precio de venta (S/)",
      "required": true,
      "kind": "number",
      "min": 0,
      "integer": false
    },
    {
      "key": "minimo",
      "label": "Stock mínimo",
      "required": true,
      "kind": "number",
      "min": 0,
      "integer": true
    },
    {
      "key": "receta",
      "label": "Requiere receta",
      "required": true,
      "options": [
        "No",
        "Sí"
      ]
    }
  ],
  "columns": [
    "codigo",
    "nombre",
    "presentacion",
    "precio",
    "categoria"
  ],
  "filterKey": "categoria"
};
