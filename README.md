# Nova Salud — NovaBotica

Sistema de gestión de botica. React + TypeScript + Vite en el frontend; NestJS y PostgreSQL en un monolito modular organizado por funcionalidades (controlador → servicio → repositorio).

**Rama de desarrollo: `develop`.** Para retomar el trabajo, comenzar por [la guía de continuidad](docs/continuidad.md).

## Estado actual

Implementado:
- Esquema PostgreSQL: 18 entidades de negocio, vista de stock, semillas y migraciones versionadas; tablas adicionales de sesiones y límites de acceso.
- Inicio de sesión real, contraseñas con scrypt, cookie HttpOnly, sesiones revocables de 8 horas, cierre de sesión y limitación de intentos.
- Guard global de autenticación, decorador de roles y navegación según administrador, vendedor o almacenero.
- Login adaptable, estados de error/carga, modo claro/oscuro persistente y fondo local de botica con capa de oscurecimiento.
- Pruebas de integración de autenticación y base de datos.

**Pendiente:** CRUD de usuarios y catálogo, compras/recepciones, ventas transaccionales, FEFO, comprobantes simulados/PDF, alertas y reportes. Sus pantallas son marcadores de posición. La navegación por rol no sustituye los permisos de cada futura operación en la API.

## Primer arranque en Windows

Requisitos: Git, Node.js 22.12+ (validado también con Node 24), npm y PostgreSQL 18 instalado con sus herramientas. No se requiere un servidor PostgreSQL previamente iniciado: se crea una instancia propia en el puerto 55432.

```powershell
git clone --branch develop https://github.com/Stefano97-ai/NovaBotica.git
cd NovaBotica
npm ci
npm run db:setup
npm run db:migrate
npm run auth:admin
```

Si PostgreSQL no está en `C:\Program Files\PostgreSQL\18\bin`, definir `$env:PG_BIN` con la carpeta correcta antes de `db:setup`. No copiar `.env.example` antes del asistente local: `db:setup` genera `backend/.env` y rechaza configuraciones preexistentes sin sus metadatos.

`auth:admin` crea el usuario `admin` y guarda una contraseña aleatoria en `.local/login-admin.txt`. Si ya existe, no la cambia. Cada equipo genera sus propias credenciales; nunca subir `.local` ni `.env`.

En dos terminales, desde la raíz:

```powershell
npm run dev:api
```

```powershell
npm run dev:web
```

Abrir **http://localhost:5173/login**. API: http://127.0.0.1:3000/api/health. Vite redirige `/api` al backend. El puerto 4173 se utilizó para previsualización local; no es el servidor de desarrollo habitual.

En siguientes sesiones: `npm run db:start`, luego iniciar API y web. Estado: `npm run db:status`. Para detener la base, cerrar la API y ejecutar `npm run db:stop`.

Para un servidor PostgreSQL externo u otro sistema operativo, configurar `DATABASE_URL` en `backend/.env`, omitir los comandos de instancia Windows y ejecutar las migraciones. Ver [base de datos](docs/base-de-datos.md).

## Validación

Con PostgreSQL disponible y las migraciones aplicadas:

```powershell
npm run typecheck
npm run build
npm run db:test
npm run auth:test
```

Las pruebas usan datos temporales y PostgreSQL real; ejecutarlas contra una base de desarrollo. Las comprobaciones visuales realizadas se describen en [login](docs/login.md); los scripts temporales locales de navegador no forman parte del repositorio.

## Documentación

- [Continuidad y próximos entregables](docs/continuidad.md)
- [Arquitectura y reglas de negocio previstas](docs/arquitectura.md)
- [Base de datos, migraciones y respaldos](docs/base-de-datos.md)
- [Autenticación, temas y decisiones visuales](docs/login.md)
- [Colaboración y validación de cambios](CONTRIBUTING.md)

## Organización

```text
frontend/src/app/             Router y estilos globales
frontend/src/features/        Funcionalidades; auth contiene el login real
frontend/src/shared/          Componentes compartidos, incluido ThemeToggle
frontend/public/images/       Fondo local generado para Nova Salud
backend/src/modules/          Auth, health y módulos de negocio pendientes
backend/src/shared/database/  Conexión y transacciones PostgreSQL
backend/database/migrations/  SQL numerado con checksum
backend/test/                 Pruebas de integración
docs/                         Decisiones y guía de continuidad
```

## Despliegue

Aún no hay un despliegue de producción validado. Servir la SPA y `/api` bajo el mismo origen, configurar resolución de rutas a `index.html`, HTTPS, `NODE_ENV=production` y `APP_ORIGINS` con orígenes exactos. Separar permisos de migración y ejecución, preparar respaldos y revisar dependencias antes del despliegue. No usar el servidor de Vite como servidor productivo.
