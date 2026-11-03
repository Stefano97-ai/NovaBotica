# Continuidad — backend Java

## Entrega actual

React permanece intacto. El backend ahora usa Java 21, Spring Boot 3.5.16, Spring MVC, Spring Security y Spring JDBC. Código funcional en backend/src/main/java/com/novasalud/{auth,inicio,health}, con Controller, Service y Repository en la raíz de cada módulo y dto/ como subcarpeta cuando se necesita. Las demás funcionalidades tienen guías de implementación. Consultar backend/README.md.

No hay Flyway/JPA ni arquitectura hexagonal añadidos: el migrador JDBC preserva el historial SQL previo y los repositorios conservan consultas explícitas. Los SQL y las bases no se recrean; sesiones y contraseñas mantienen compatibilidad con Node. No modificar los bytes de migraciones aplicadas.

Los scripts de arranque npm llaman Maven para backend y Vite para frontend. El único auxiliar Node asociado a PostgreSQL está en scripts/database/local-db.mjs: prepara la instancia Windows, no implementa lógica de servidor. La imagen API usa JRE 21 y un JAR; no usa Node.

## Retomar

1. Seguir README para Docker o entorno local.
2. Ejecutar mvn -f backend/pom.xml test con Docker activo. JUnit/MockMvc y Testcontainers prueban contra una base temporal aislada.
3. Conservar DATABASE_URL, COOKIE_SECURE y APP_ORIGINS. Para HTTPS activar COOKIE_SECURE explícitamente; NODE_ENV no tiene efecto en Java.
4. Administrador existente: conserva su contraseña. Para base nueva usar auth:admin o NOVA_CREATE_ADMIN=true; credenciales fuera de Git.
5. Revisar documentación de inicio/login para contratos y límites. Los controladores devuelven JSON para React, que es la Vista MVC.

## Pendiente funcional

Confirmar SRS vigente (el PDF no está en Git), matriz CRUD de permisos, unidades/conversiones, impuestos, descuentos/anulaciones, requisitos por comprobante y ventanas de alertas. La ventana de 30 días del panel es un criterio inicial visible.

Orden sugerido: administración de cuentas y catálogo; proveedores/compras/recepciones; inventario y movimientos; venta transaccional con FEFO, idempotencia y concurrencia; comprobantes simulados/PDF; alertas completas y reportes.

Servicios coordinan transacciones y colaboración entre módulos. No hay endpoints de negocio todavía. Cada operación nueva debe declarar roles y probar errores/concurrencia. No crear controladores que deleguen directamente en SQL.

## Límites preservados

Sesiones de 8 horas sin renovación automática. Desactivar una cuenta bloquea acceso pero reactivarla puede rehabilitar una sesión aún vigente; el futuro módulo usuarios debe definir revocación global. No hay recuperación automática de contraseña. Los límites incluyen intentos exitosos. La API no confía en cabeceras de IP de proxy.

No hay CI ni suite E2E de navegador versionada. Las verificaciones de UI previas son manuales/temporales. El backend sí incluye tests reproducibles de contratos, autenticación, persistencia y resumen. No confundir integración de lectura con implementación de ventas o FEFO.
