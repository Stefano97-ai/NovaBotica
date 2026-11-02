# Proveedores

Módulo reservado; todavía no implementa operaciones de negocio.

Al desarrollar esta funcionalidad agregar:
- `proveedores.controller.ts`: entrada HTTP y validación de DTOs.
- `proveedores.service.ts`: reglas y coordinación de casos de uso.
- `proveedores.repository.ts`: acceso a PostgreSQL con contexto transaccional cuando corresponda.
- `dto/`: contratos y validaciones de entrada.
- `entities/`: modelos del módulo.

Los controladores no acceden directamente a la base de datos. Colaborar entre servicios, nunca entre controladores. Exportar solo los servicios necesarios para otros módulos.
