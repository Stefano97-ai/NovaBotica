# Datos locales de demostración

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
