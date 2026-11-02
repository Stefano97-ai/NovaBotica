# Arranque local con Docker

Requiere Docker Desktop iniciado, motor de contenedores Linux y Docker Compose. Desde la raíz:

```powershell
npm run docker:up
```

La primera ejecución descarga imágenes, instala dependencias, compila, prepara PostgreSQL, aplica migraciones y crea un administrador. Abrir http://localhost:8080/login. Las credenciales de este administrador están en `.local/docker/login-admin.txt`; son independientes de las de la instancia local de Windows.

`docker:setup` genera una sola vez `.local/docker.env` con contraseñas aleatorias. No compartir ni versionar estos archivos. No regenerar las contraseñas mientras exista el volumen PostgreSQL: deben coincidir con sus roles persistidos.

## Servicios

- web: Nginx sirve la SPA compilada y redirige /api al backend.
- api: Spring Boot (JRE 21) escucha dentro de la red Docker; no publica puerto al equipo.
- migrate: proceso de una sola ejecución, termina al aplicar SQL.
- db: PostgreSQL 18, volumen `nova-salud_postgres_data`; sin puerto publicado. Usuario de aplicación sin privilegios de superusuario.

Solo la web se publica en 127.0.0.1:8080. La instancia Windows del puerto 55432 queda independiente; los datos no se copian automáticamente.

## Operación

```powershell
npm run docker:status
npm run docker:logs
npm run docker:down
npm run docker:up
```

`down` conserva el volumen. No usar `down -v` salvo que se quiera eliminar deliberadamente toda la base Docker. Las modificaciones de código requieren reconstrucción con `docker:up`; no hay hot reload. Las migraciones existentes mantienen sus checksums, no normalizar sus finales de línea si ya se aplicaron.

Esta configuración es para uso local por HTTP: COOKIE_SECURE=false permite cookies sin Secure. Para producción configurar HTTPS, COOKIE_SECURE=true, orígenes exactos, gestión de secretos y respaldos. No publicar directamente esta configuración en Internet. Si falla el arranque, revisar Docker Desktop y docker:logs; un proceso migrate finalizado con código 0 es normal.

## Validación local

Construcción completa y arranque comprobados. Web, conexión PostgreSQL, rechazo de rutas privadas sin sesión, login, resumen de inicio y logout verificados por HTTP a través de Nginx. Recrear los contenedores conservó el volumen y la cuenta admin. El proceso migrate terminó con código 0 y la API/base quedaron saludables.
