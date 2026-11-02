# Frontend Nova Salud

React y TypeScript, organizado por funcionalidad y por capas. Esta refactorización conserva la interfaz y el contrato HTTP del backend Java.

## Organización

```text
src/
  app/                       Composición, proveedores, rutas y layout
  features/
    auth/
      domain/                Contrato del repositorio y credenciales
      application/           Casos de uso independientes de React y HTTP
      infrastructure/        Adaptador HTTP del repositorio
      presentation/          Contexto, hooks, componentes y páginas
    inicio/                  Las mismas cuatro capas
    ventas/                  Dominio de cotización y presentación
  shared/
    domain/                  Usuario, roles, permisos y contratos del tema
    application/             Errores y casos de uso del tema
    infrastructure/          Cliente HTTP y almacenamiento del navegador
    presentation/            Componentes comunes, navegación y formato
```

Los demás módulos ofrecen formularios de borrador; reportes consume el resumen existente.

## Dependencias y SOLID

- Dominio no depende de React, HTTP ni de otras capas.
- Aplicación depende de contratos del dominio; recibe repositorios por parámetro.
- Infraestructura implementa esos contratos con HTTP o almacenamiento del navegador.
- Presentación consume casos de uso mediante contextos; los hooks coordinan estado y las páginas renderizan.
- `app/services.ts` conecta implementaciones concretas y `app/providers.tsx` las distribuye. Es el punto para reemplazar un adaptador.
- `shared` no importa funcionalidades. Presentación e infraestructura no se importan entre sí.

La responsabilidad única se aplica separando transporte, sesión, formulario, navegación y renderizado. Interfaces pequeñas y composición permiten sustituir repositorios sin cambiar vistas ni casos de uso; no se introduce herencia artificial.

Los permisos de navegación viven en `shared/domain/access.ts`. El backend sigue siendo la autoridad de seguridad. El script inicial de tema en `index.html` aplica la preferencia antes del primer render para evitar parpadeos; los cambios posteriores usan el repositorio del navegador.

## Desarrollo y verificación

Desde la raíz del repositorio:

```sh
npm run dev --workspace frontend
npm run check:architecture --workspace frontend
npm run test --workspace frontend
npm run build --workspace frontend
```

Las pruebas usan Node y TypeScript ya instalados, sin librerías adicionales. Cubren permisos, redirecciones, credenciales, errores HTTP, cancelación y tema. `.test-build/` es una salida temporal ignorada. El chequeo arquitectónico verifica imports estáticos y acceso directo a HTTP/almacenamiento en presentación; no sustituye la revisión de código.

Para una nueva funcionalidad, definir sus datos y contrato, implementar los casos de uso y el adaptador, conectarlos en `app`, y añadir hooks y vistas. Registrar ruta y permisos explícitamente. Mantener pruebas de comportamiento y probar sesión, navegación, tema y vista móvil al modificar componentes compartidos.

Para actualizar únicamente la web Docker, conservando API y base de datos:

```sh
docker compose --env-file .local/docker.env build web
docker compose --env-file .local/docker.env up -d --no-deps web
```

## Módulos de trabajo (frontend)

Productos, inventario, compras, proveedores, comprobantes y usuarios ofrecen formularios, edición, descarte, búsqueda y filtros de borradores. Ventas ofrece una cotización con líneas e importes calculados en céntimos. Reportes consulta el resumen real de `/api/inicio`; no inventa series históricas.

**Límite actual:** el backend solo expone sesión, salud y resumen. Los borradores viven en memoria dentro de `DraftProvider`, persisten al navegar y se destruyen al recargar o salir del layout autenticado. No se guardan contraseñas, no se crean usuarios, no se emiten comprobantes y no se registran ventas/compras ni movimientos de stock. La UI lo indica explícitamente.

El contrato `DraftRepository`, los casos de uso y el adaptador de memoria están separados. Cada módulo declara sus campos en `presentation/config`; `useDraftModule` coordina estado y `DraftModule` renderiza. Ventas mantiene sus reglas de importes en su propio dominio. Las configuraciones de formularios no son contratos de la futura API: al integrar operaciones reales se deben crear repositorios y casos de uso específicos con modelos de negocio, autorización, errores, FEFO y transacciones validados en servidor.

No se añadió ningún endpoint ni se cambió el backend. Los formularios actuales son preparación de datos, no una implementación completa de las operaciones del SRS.

## Componentes shadcn/ui y vidrio

La presentación usa componentes oficiales de shadcn/ui generados con el registro `new-york`, en `src/shared/presentation/ui`. `components.json` configura futuras incorporaciones. `Button`, `Input`, `Label` y `Card` se utilizan en las pantallas existentes; los estilos propios conservan dimensiones, estados y colores del producto. Los componentes son código local editable, no una dependencia opaca.

Tailwind v4 se integra con Vite. Se importan tema y utilidades sin Preflight para no reiniciar los estilos existentes. El modo oscuro sigue `data-theme` y las variables de Nova Salud. `app/glass.css` concentra transparencias y desenfoque, con alternativa opaca sin `backdrop-filter` o con preferencia por transparencia reducida. No hay animación continua del fondo ni del desenfoque.

Referencia: https://ui.shadcn.com/docs/installation/vite
