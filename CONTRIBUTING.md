# Colaboración

1. Actualizar `develop` y crear una rama por funcionalidad. Abrir una PR hacia `develop` con problema, comportamiento resultante y validación.
2. Mantener MVC por funcionalidades: controller → service → repository/model en Java, con React como Vista. Nunca SQL en controladores ni reglas comerciales únicamente en React.
3. Proteger nuevas operaciones con sesión y roles. Los controles visuales no son autorización.
4. Crear migraciones SQL nuevas y numeradas; no editar migraciones aplicadas. Coordinar numeración entre equipos.
5. En operaciones comerciales, compartir el mismo cliente transaccional. Cubrir errores, concurrencia e idempotencia con pruebas reales cuando corresponda.
6. Ejecutar `npm run typecheck`, `npm run build`, `npm run db:test` y `npm run auth:test` con Docker disponible para Testcontainers. Revisar cambios visuales en escritorio/móvil y ambos temas.
7. Actualizar documentación de configuración, decisiones y pendientes. No presentar módulos iniciales como funcionalidades terminadas.

Usar `npm ci` con el lockfile. No incluir `.env`, `.local`, contraseñas, datos personales, node_modules ni dist en commits. Mantener mensajes de error en español y accesibilidad de controles, foco y estados de espera. El fondo del login es un recurso local generado; no depende de servicios de imágenes externos.
