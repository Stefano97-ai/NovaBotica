# NovaBotica — Nova Salud

Base arquitectónica: React + TypeScript + Vite y NestJS, organizada por funcionalidades. Backend como monolito modular con controladores, servicios y repositorios. PostgreSQL conectado mediante pg y migraciones SQL.

## Estado

- Repositorio: https://github.com/Stefano97-ai/NovaBotica. Desarrollo sobre la rama `develop`.
- Pantallas iniciales de navegación y módulos NestJS registrados.
- Endpoints: `GET /api/health` (proceso) y `GET /api/health/db` (conexión y migración).
- PostgreSQL exclusivo en 127.0.0.1:55432, 18 tablas de negocio, migraciones y conexión transaccional con pg.
- No están implementados autenticación, permisos, operaciones comerciales, FEFO ni PDF. Las pantallas son marcadores de posición.
- Dependencias instaladas y lockfile generado. Compilación y pruebas de integración sobre PostgreSQL disponibles.

## Estructura

```text
frontend/src/
  app/                  Navegación y estilos globales
  features/             Pantallas agrupadas por funcionalidad
  shared/               Componentes y cliente HTTP compartidos
backend/src/
  modules/              Módulos de negocio y health
  shared/auth/          Política de acceso por implementar
  shared/database/      Conexión PostgreSQL y transacciones compartidas
docs/
  arquitectura.md        Decisiones y plan de implementación
```

## Desarrollo local

Requiere Node.js 22.12+ (también puede usarse Node 24) y npm.

Desde la raíz, cuando haya acceso a npm:

```powershell
npm install
npm run db:setup
npm run db:migrate
npm run typecheck
npm run build
```

Abrir dos terminales en la raíz:

```powershell
npm run dev:api
```

```powershell
npm run dev:web
```

Frontend: http://localhost:5173. API: http://127.0.0.1:3000/api/health.
Vite redirige `/api` al backend durante desarrollo. Para producción, configurar el servidor web para servir la SPA, resolver rutas hacia index.html y redirigir `/api` al backend bajo el mismo origen.

`db:setup` genera backend/.env con credenciales aleatorias excluidas de Git. El backend ahora requiere PostgreSQL al arrancar. En siguientes sesiones ejecutar `npm run db:start`. El puerto de API por defecto es 3000; si se cambia, actualizar el proxy de Vite. Consultar `docs/base-de-datos.md` para operación y supuestos. Ejecutar `npm run db:test` para verificar integridad y conexión HTTP real.

## Obtener el proyecto

```powershell
git clone --branch develop https://github.com/Stefano97-ai/NovaBotica.git
cd NovaBotica
```

Después seguir los pasos de desarrollo local. Cada equipo genera sus propias credenciales y datos; `.env`, `.local`, dependencias y compilados no se incluyen en el repositorio.

Consultar `docs/arquitectura.md` para responsabilidades, reglas y pruebas previstas.
