# Base de datos de Nova Salud

## Instancia local

PostgreSQL 18 exclusivo del proyecto en 127.0.0.1:55432, base nova_salud, usuario nova_salud_app. El usuario no es superusuario ni puede crear bases o roles; es propietario del esquema para migraciones de desarrollo. Autenticación SCRAM-SHA-256 y acceso solo por loopback.

Credenciales de conexión en backend/.env; configuración administrativa en .local/database.json. Ambos excluidos de Git. Datos físicos en .local/postgres-data y registro en .local/postgres.log. No borrar .local ni compartir sus archivos. No se modifica el servidor del puerto 5432.

La instancia no es un servicio de arranque automático: después de reiniciar Windows ejecutar db:start.

## Comandos desde la raíz

```powershell
npm install
npm run db:setup
npm run db:migrate
npm run dev:api
```

En siguientes sesiones: `npm run db:start`. Estado: `npm run db:status`. Pruebas: `npm run db:test`. Parada controlada: `npm run db:stop` (detener primero el backend).

PG_BIN puede apuntar a otra carpeta bin de PostgreSQL. Los scripts de instancia son para Windows; la conexión y las migraciones funcionan con un servidor remoto configurando DATABASE_URL. db:setup preserva .env existente.

## Modelo

001_initial.sql crea las 18 entidades del SRS, la vista stock_disponible y semillas de tres roles, tres tipos de comprobante y series de demostración. schema_migrations guarda versiones y checksum. La migración no crea usuarios de acceso ni datos comerciales de ejemplo. Ejecutar `npm run auth:admin` después de migrar para crear el administrador local. 002_auth.sql agrega las tablas sesion y acceso_limite y unicidad del username normalizado.

Las migraciones tienen transacciones y bloqueo para impedir ejecuciones simultáneas. No editar una migración aplicada; agregar una nueva. Reejecutar db:migrate no duplica tablas ni semillas.

Restricciones: claves foráneas, cantidades positivas, stock no negativo, importes decimales, correlativo único por serie, idempotencia de venta y recepción por fila, producto coincidente entre detalle y lote. Movimientos con signo: entrada positiva, salida negativa, ajuste positivo o negativo. Sin borrado en cascada.

## Supuestos y límites

- Una unidad base por producto y cantidades enteras; conversiones caja/blíster/tableta pendientes.
- Lote vigente hasta finalizar su fecha de vencimiento en America/Lima y siempre que esté disponible.
- No se fija IGV ni precios con/sin impuesto. Los detalles guardan tasa e importes históricos; el futuro servicio aplicará el cálculo aprobado.
- Cliente opcional en venta; requisitos por tipo de comprobante se validarán en el servicio.
- Un comprobante simulado por venta. PDF posterior al commit y reintentos sobre el mismo registro.
- Clave de recepción por fila; un endpoint de recepción multilínea deberá manejar también idempotencia de solicitud completa.
- En producción separar usuario migrador y usuario de ejecución, limitar permisos y configurar TLS y respaldos.

La base prepara soporte para FEFO, pero no implementa todavía el servicio de ventas. FEFO, pagos suficientes, sumas entre detalles, anulaciones, recepción excedente y movimiento obligatorio por cambio de stock necesitan servicios transaccionales y pruebas adicionales. Las restricciones no reemplazan esas reglas.

## Verificación

db:test usa PostgreSQL real: commit, rollback, stock negativo, stock vendible, idempotencia de venta, correspondencia de producto/lote, correlativos únicos y endpoint HTTP NestJS. Los fixtures se revierten; la prueba de commit elimina solo la categoría aleatoria que ella creó. Las secuencias pueden avanzar durante las pruebas.

## Respaldo

Usar pg_dump en formato custom y pg_restore sobre una base separada, sin credenciales en el historial de comandos. Guardar respaldos fuera de Git. El ensayo de restauración de RNF-10 sigue pendiente; esta fase valida esquema y conexión.

## Pendiente de dependencias

La auditoría de npm del 01/11/2026 reportó 7 alertas: 2 altas en multer y su dependencia padre @nestjs/platform-express, 4 moderadas y 1 baja en la cadena de herramientas de Nest CLI. npm audit fix no las resolvió. Revisar actualizaciones compatibles o migración de versión mayor antes de desplegar; no se aplicó audit fix --force. No hay endpoints de carga de archivos implementados.
