import type { ModuleDefinition } from '../../../../shared/presentation/components/DraftModule';
export const definition: ModuleDefinition = {
  "key": "usuarios",
  "title": "Usuarios y roles",
  "description": "Prepara solicitudes de acceso para el equipo de Nova Salud.",
  "singular": "solicitud de acceso",
  "note": "No se crean cuentas ni se cambian permisos. No ingreses contraseñas aquí; el alta segura de credenciales quedará a cargo del backend.",
  "fields": [
    {
      "key": "nombre",
      "label": "Nombre completo",
      "required": true
    },
    {
      "key": "usuario",
      "label": "Nombre de usuario",
      "required": true,
      "pattern": "^[a-zA-Z0-9._-]{3,40}$",
      "hint": "De 3 a 40 letras, números, puntos, guiones o guiones bajos."
    },
    {
      "key": "rol",
      "label": "Rol",
      "required": true,
      "options": [
        "Administrador",
        "Vendedor",
        "Almacenero"
      ]
    },
    {
      "key": "correo",
      "label": "Correo",
      "required": false,
      "kind": "email"
    },
    {
      "key": "estado",
      "label": "Estado solicitado",
      "required": true,
      "options": [
        "Activo",
        "Inactivo"
      ]
    }
  ],
  "columns": [
    "nombre",
    "usuario",
    "rol",
    "estado"
  ],
  "filterKey": "rol"
};
