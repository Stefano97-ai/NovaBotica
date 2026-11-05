# Datos de demostración locales y en Railway

## Carga completa desde el repositorio

Los registros de PostgreSQL no se transfieren al subir código a GitHub ni al desplegar en Railway. El repositorio contiene una carga reproducible, sin contraseñas, sesiones ni copias de usuarios. Para cargar el catálogo, operaciones y series opcionales en la base de destino:

1. Instalar las dependencias con `npm ci` y tener aplicadas las migraciones actuales de la aplicación.
2. Disponer de un administrador y un vendedor activos. El script utiliza sus identificadores y no crea ni cambia credenciales.
3. Guardar un respaldo de la base de destino.
4. Configurar `DATABASE_URL` en el entorno del comando con la conexión PostgreSQL de destino y ejecutar `npm run db:seed`.

En Railway, ejecutar el comando desde una máquina con acceso a su conexión pública PostgreSQL o desde un entorno que alcance su conexión privada. Usar la variable real del servicio PostgreSQL, sin guardarla en archivos versionados. El comando requiere Node.js y las dependencias del repositorio, no la imagen Java de producción.

El comando ejecuta `seed-demo.sql` y `seed-demo-series.sql` en una única transacción. Si falla una validación, revierte toda la carga. Muestra al terminar las cantidades de productos, lotes, ventas y series de demostración. No borra registros ni duplica el conjunto existente. Si ya existe DEMO-NS, conserva sus fechas y operaciones: volver a ejecutarlo no reinicia las existencias ni copia cambios posteriores hechos en otra base.

## Contenido y ejecución con PostgreSQL local

Carga opcional: `scripts/database/seed-demo.sql`. No forma parte de las migraciones ni se ejecuta al iniciar la aplicación. Los precios, clientes, empresas, identificadores y operaciones son ficticios; sirven para probar módulos y gráficos, no constituyen información comercial ni tributaria real.

Incluye 24 productos en 9 categorías, cuatro proveedores, doce clientes sintéticos, ocho compras recibidas, 48 lotes y ventas distribuidas durante los últimos 90 días. Utiliza los usuarios administrador y vendedor existentes; no modifica contraseñas. Genera pagos, asignaciones FEFO, movimientos con saldos y comprobantes simulados con leyenda de demostración.

Identificadores: productos `DEMO-NS-*`, lotes `DEMO-NS-*`, movimientos/pagos con referencia `DEMO-NS-V1`, comprobantes con `datos_documento.demo=DEMO-NS-V1` y series dedicadas `BDEM` / `FDEM`. Estas series permanecen inactivas para no participar en nuevas ventas normales del POS.

Las existencias se reciben antes de venderse; se excluyen lotes no disponibles y vencidos en la fecha de cada venta. Algunos productos tienen pocas existencias iniciales y quedan en niveles críticos. Otros conservan stock que vence en los intervalos 0–30, 31–60 y 61–90 días. Las cantidades se expresan en la presentación base de cada producto.

La carga es transaccional, toma un bloqueo para evitar ejecuciones simultáneas y verifica stock contra movimientos, ventas contra detalles/pagos y cantidades contra asignaciones. Cualquier error revierte la carga. Al encontrar productos `DEMO-NS-*`, no repite ni actualiza el conjunto: las fechas quedan ancladas al día de la primera ejecución. Una colisión con los identificadores sintéticos de proveedor o cliente provoca un error y revierte todo, en lugar de reutilizar identidades ajenas.

Desde PowerShell, con Docker local activo y permisos para acceder a él:

```powershell
Get-Content -Raw -Encoding UTF8 scripts/database/seed-demo.sql | docker compose -f compose.yaml --env-file .local/docker.env exec -T db psql -U nova_admin -d nova_salud
```

Se recomienda guardar un respaldo antes de ejecutar. El script conserva los registros previos y añade exclusivamente el conjunto de demostración. No tiene borrado automático; para eliminarlo posteriormente, primero debe revisarse si nuevos registros comerciales referencian sus productos o lotes.
