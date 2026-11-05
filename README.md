# Nova Salud — NovaBotica

Sistema de gestión de botica con **React + TypeScript** en la vista y **Java 21 + Spring Boot** en el backend. Monolito modular organizado por funcionalidades y MVC: controller → service → repository/model. PostgreSQL como fuente de verdad.

## Estado

- Autenticación real, sesiones revocables y roles; contraseñas scrypt compatibles con las cuentas anteriores.
- Inicio con resumen real de inventario/ventas, acceso según rol y alertas calculadas.
- Centro de alertas persistentes: campana con contador por usuario, prioridades, historial y destinatarios por rol. [Funcionamiento y configuración](docs/alertas.md).
- React conserva diseño, modo claro/oscuro y navegación.
- Catálogo, compras y recepciones; ventas transaccionales con FEFO, pagos fraccionados, series opcionales y comprobantes simulados. [Ventas y series](docs/ventas-pagos-series.md).
- Backend TypeScript reemplazado por Java. Ver [backend](backend/README.md) y [continuidad](docs/continuidad.md).

## Ejecutar con Docker

Con Docker Desktop iniciado y contenedores Linux:

```powershell
npm run docker:up
```

Abrir http://localhost:8080/login. Usuario admin y contraseña aleatoria en `.local/docker/login-admin.txt`. Se conserva el volumen y las cuentas existentes al actualizar a Java. [Guía Docker](docs/docker.md).

## Desarrollo sin contenedores de aplicación

Requisitos: Node.js 22.12+, npm, Java 21, Maven 3.6.3+ y PostgreSQL 18. El asistente de PostgreSQL local requiere Windows; también puede configurarse DATABASE_URL contra otro servidor.

```powershell
git clone --branch develop https://github.com/Stefano97-ai/NovaBotica.git
cd NovaBotica
npm ci
npm run db:setup
npm run db:migrate
npm run auth:admin
```

db:setup genera backend/.env; no copiar .env.example antes de ese asistente. Si PostgreSQL no está en C:\Program Files\PostgreSQL\18\bin, configurar PG_BIN. La contraseña local está en `.local/login-admin.txt`, independiente de Docker.

En dos terminales desde la raíz:

```powershell
npm run dev:api
npm run dev:web
```

Ejecutar cada comando en su propia terminal. Web http://localhost:5173/login; API http://127.0.0.1:3000/api/health. En siguientes sesiones iniciar la base con npm run db:start. Si ya hay una API anterior ocupando el puerto 3000, detener ese proceso antes de arrancar Java.

## Validación

```powershell
npm run typecheck
npm run build
mvn -f backend/pom.xml test
```

Las pruebas Java crean PostgreSQL temporal mediante Testcontainers (Docker debe estar iniciado). `npm run db:test`, `auth:test` e `inicio:test` son aliases de la suite Java completa. No dependen de credenciales o fixtures locales. El frontend no se migró ni rediseñó.

## Documentación

- [Backend MVC por funcionalidades](backend/README.md)
- [Continuidad y próximos entregables](docs/continuidad.md)
- [Arquitectura y reglas previstas](docs/arquitectura.md)
- [Base de datos](docs/base-de-datos.md)
- [Autenticación](docs/login.md)
- [Inicio](docs/inicio.md)
- [Docker](docs/docker.md)
- [Contribuciones](CONTRIBUTING.md)

## Entrega

No versionar `.env`, `.local`, target, dist ni node_modules. No regenerar contraseñas de Docker si se conserva el volumen. Para producción: HTTPS, COOKIE_SECURE=true, APP_ORIGINS exactos, permisos de base separados y respaldos. La configuración Compose es local, publicada únicamente en 127.0.0.1:8080; producción todavía no está validada.
