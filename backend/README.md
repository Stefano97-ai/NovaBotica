# Backend Java — MVC por funcionalidades

Java 21, Spring Boot 3.5.16, Spring MVC, Spring Security y Spring JDBC. PostgreSQL conserva el esquema existente. React sigue siendo la Vista; los controladores REST devuelven DTO JSON compatibles con la interfaz actual.

```text
src/main/java/com/novasalud/
  NovaSaludApplication.java
  config/                   Seguridad, JSON y conexión JDBC
  shared/
    database/               Migraciones compatibles con el historial previo
    exception/              Respuestas de error uniformes
  modules/
    auth/
      controller/           Login, logout y sesión actual
      dto/                  LoginRequest, UserResponse
      model/                Account, SessionUser
      service/              Casos de uso, scrypt, creación inicial de admin
      repository/           SQL parametrizado y transacción de sesión
      security/             Cookie y filtro de autenticación/origen
    inicio/
      controller/           GET /api/inicio
      dto/                  Resumen, ventas y lotes
      service/              Coordinación del resumen por usuario
      repository/           Consulta consistente de PostgreSQL
    health/                 Controller → service → repository
    usuarios/ catalogo/ inventario/ proveedores/ compras/
    clientes/ ventas/ comprobantes/ reportes/  (pendientes)
src/test/java/              JUnit, MockMvc y Testcontainers
src/main/resources/         Configuración
 database/migrations/       SQL original sin cambios de contenido
```

## Reglas

- Controller: HTTP, validación y permisos. Sin SQL ni cálculo comercial.
- Model: estado y conceptos del módulo. DTO: contrato público, nunca contraseña ni token de sesión en JSON.
- Service: reglas y coordinación; usar @Transactional en operaciones de varias escrituras.
- Repository: acceso PostgreSQL mediante Spring JDBC y parámetros; participa en la transacción del servicio.
- View: React. No se agregan plantillas Thymeleaf ni se modifica el frontend.
- Cada funcionalidad es dueña de sus clases. No hay carpetas globales de controllers/services/repositorios mezclando módulos. Las funcionalidades pendientes contienen su guía, no endpoints ficticios.
- @PreAuthorize para permisos; filtro global para sesión y protocolo de origen/cabecera. No confiar en navegación o botones ocultos.

Se mantiene SQL explícito con JDBC en lugar de introducir un ORM durante la migración: permite conservar las consultas, los bloqueos y la semántica transaccional actuales. Una futura incorporación de JPA requiere decisión separada.

## Ejecutar

Desde la raíz: npm run dev:api. Requiere Java 21 y Maven 3.6.3+. Usa backend/.env si existe, sin sobrescribir variables del entorno. Alternativa desde backend: mvn spring-boot:run.

Compilar: mvn -f backend/pom.xml package -DskipTests. Ejecutar desde backend: java -jar target/nova-salud-api.jar. Migrar únicamente: agregar --nova.command=migrate; crear admin: --nova.command=admin. Las migraciones también se validan/aplican al arrancar.

Pruebas: mvn -f backend/pom.xml test. Requieren Docker para PostgreSQL efímero; no usan ni alteran las bases locales o Docker de Nova Salud. Incluyen fixture scrypt producido por Node, sesiones heredadas, rotación, expiración, roles, CSRF/origen, validación estricta, límites, ventas por rol, stock y checksums.

## Compatibilidad

Rutas /api/auth/login, /api/auth/me, /api/auth/logout, /api/inicio, /api/health y /api/health/db conservadas. IDs de usuario como string; importes como string. Cookie nova_session, HttpOnly, SameSite=Strict, duración 8 horas y mismo hash SHA-256 de token. COOKIE_SECURE=true se configura explícitamente para HTTPS; NODE_ENV ya no controla Java.

Scrypt conserva N=32768, r=8, p=3, salida de 64 bytes y sal hexadecimal interpretada como texto UTF-8. Los hashes actuales y las sesiones vigentes no necesitan reset. Los límites siguen persistidos en acceso_limite.

El migrador Java conserva schema_migrations, nombres 001_initial.sql/002_auth.sql, SHA-256 de bytes originales, bloqueo asesor y transacciones. No se introduce Flyway ni un segundo historial en esta migración. Nunca reescribir finales de línea o contenido de SQL ya aplicado.

La API escucha 127.0.0.1 salvo HOST explícito. Docker usa 0.0.0.0 internamente. APP_ORIGINS define orígenes permitidos separados por comas. No se confía en X-Forwarded-For; un proxy puede agrupar intentos por IP como en la versión previa.

Los comandos de preparación de PostgreSQL Windows quedan en scripts/database/local-db.mjs como herramientas de desarrollo; no forman parte del servidor Java ni contienen reglas de negocio. Los antiguos fuentes/tests de NestJS fueron retirados y siguen recuperables en Git.

Referencia de plataforma: [requisitos oficiales de Spring Boot 3.5](https://docs.spring.io/spring-boot/3.5/system-requirements.html). Java 21 está dentro del rango soportado.
