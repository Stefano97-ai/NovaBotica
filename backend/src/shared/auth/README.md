# Política de acceso

La implementación reside en `modules/auth`: guard global de autenticación y decorador Roles. No duplicar aquí la lógica de sesión. Los roles disponibles son ADMINISTRADOR, VENDEDOR y ALMACENERO. La matriz detallada de operaciones comerciales sigue pendiente de confirmación; cada endpoint nuevo debe comprobar sus permisos en el servidor.
