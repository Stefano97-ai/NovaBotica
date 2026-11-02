# Arquitectura de Nova Salud

## Decisión

Monolito modular organizado por funcionalidades. React actúa como vista y consume una API HTTP de NestJS. En el backend se aplica controlador → servicio → repositorio. Es una adaptación de MVC para una SPA separada, no renderizado MVC de plantillas en el servidor.

La base inicial no incorpora arquitectura hexagonal completa ni microservicios. Se reservan interfaces para integraciones que realmente requieran sustitución, en especial emisión de comprobantes.

## Responsabilidades

- Frontend: presentación, navegación, formularios y carrito. Los totales mostrados son orientativos hasta validación del servidor.
- Controladores: contrato HTTP, DTOs, autenticación/autorización y traducción de errores. Sin SQL ni reglas comerciales.
- Servicios: casos de uso y reglas; coordinan una transacción compartida cuando hay múltiples escrituras.
- Repositorios: consultas y escrituras. Reciben el contexto transaccional; no abren ni confirman transacciones independientes dentro de una venta.
- PostgreSQL: fuente de verdad, claves foráneas, restricciones, bloqueos y persistencia.

Los archivos controller/service/repository se agregarán con el primer caso de uso de cada módulo. No se han creado métodos vacíos que aparenten operaciones implementadas. Cada módulo contiene su guía de desarrollo.

## Módulos y trazabilidad

| Módulo | Responsabilidad | SRS |
|---|---|---|
| auth, usuarios | Sesiones, cuentas, roles y permisos | RF-01 a RF-05 |
| catalogo | Productos y categorías | RF-06 |
| inventario | Lotes, movimientos, stock, FEFO y alertas | RF-07 a RF-13 |
| proveedores, compras | Proveedores, compras y recepción parcial | RF-14 a RF-18 |
| clientes, ventas | Clientes, carrito, cálculo, pagos y anulación | RF-19 a RF-24 |
| comprobantes | Series, correlativos, emisión simulada y PDF | RF-25 a RF-28 |
| reportes | Consultas e indicadores | RF-29 |
| frontend inicio, ventas | Inicio, alertas flotantes y disposición de venta | RF-30 y RF-31 |

## Flujo de confirmación de venta previsto

1. Autenticar y comprobar permiso en la API; validar entrada y clave de idempotencia.
2. Iniciar transacción. Controlar solicitudes repetidas mediante una clave única persistida junto a la operación.
3. Bloquear existencias relevantes en orden consistente y revalidar stock, vigencia, cantidades, precios y pagos.
4. Asignar FEFO por vencimiento con desempate determinista. Guardar DETALLE_VENTA_LOTE para permitir consumir varios lotes por línea.
5. Guardar venta, detalles, pagos, descuentos y movimientos; reservar serie/correlativo y comprobante pendiente dentro de la misma transacción.
6. Confirmar todo o revertir todo. Aplicar reintentos acotados cuando corresponda a conflictos transaccionales.
7. Generar PDF después del commit y actualizar su estado. Reintentar por ID de comprobante sin repetir la venta, el pago ni el movimiento.

La concurrencia requiere implementación y pruebas con PostgreSQL. Un patrón arquitectónico o un ORM no garantizan por sí solos la ausencia de sobreventa.

## Otras invariantes

- Recepciones: validar pendiente bajo concurrencia y guardar recepción, lotes, movimientos y estado de compra en una transacción.
- Anulaciones: autorización, trazabilidad y movimientos compensatorios; no borrar historial ni aplicar dos veces la compensación.
- Importes: aritmética decimal y conservación de precios/impuestos históricos de la operación.
- Comprobantes: restricción única serie/correlativo y leyenda SIMULADO / SIN VALIDEZ TRIBUTARIA.
- Stock vendible: suma de lotes válidos disponibles. No mantener un total editable independiente.
- Alertas: recalcular por operaciones relevantes y por paso del tiempo, aunque no haya movimientos.
- Permisos: denegación por defecto en API; controles visuales solo complementarios. No exponer endpoints de negocio antes de habilitar autorización.

## Datos y decisiones pendientes

El SRS propone 18 entidades: ROL, USUARIO, CATEGORIA, PRODUCTO, LOTE, MOVIMIENTO, PROVEEDOR, COMPRA, DETALLE_COMPRA, RECEPCION_LOTE, CLIENTE, VENTA, DETALLE_VENTA, DETALLE_VENTA_LOTE, PAGO, TIPO_COMPROBANTE, SERIE_COMPROBANTE y COMPROBANTE.

Antes de implementar los casos de uso: confirmar unidades y conversiones; precios con/sin impuesto; matriz de permisos; ventanas de alertas; anulaciones y excepciones de pago. La migración inicial incluye fecha de ingreso de lote, fecha/motivo/referencia de movimientos e idempotencia de ventas y recepciones. Los supuestos de unidad y caducidad están en base-de-datos.md. Las sesiones y los límites de acceso se persisten mediante la migración 002_auth.sql; consultar login.md.

Se eligió pg (node-postgres) con migraciones SQL versionadas. La migración inicial crea las 18 entidades y DatabaseService coordina conexiones y transacciones. Los supuestos iniciales y reglas pendientes se documentan en base-de-datos.md. Credenciales locales fuera de Git.

## Pruebas previstas

- CA-01: venta de 40 con lotes 30/50/20 asigna 30 y 10.
- CA-02: fallo intermedio revierte venta, pagos y stock.
- CA-03/04: umbral de stock y exclusión de lotes vencidos.
- CA-05: recepción de 60 sobre 100 deja pendiente 40.
- CA-06: vendedor no puede administrar usuarios por API.
- CA-07/08: correlativo único y reintento PDF sin duplicados.
- CA-09: login y alertas en 1366×768.
- Pruebas adicionales: ventas concurrentes, solicitudes repetidas y recepciones concurrentes.

Las pruebas de negocio se implementarán junto a sus casos de uso. Ya existen pruebas de integración para conexión HTTP, transacciones, stock no negativo, stock vendible, claves foráneas, idempotencia de venta y correlativos únicos.

## Orden de implementación

1. Resolver permisos y reglas pendientes; diseñar esquema y migraciones.
2. Autenticación, autorización y catálogo.
3. Compras, recepciones, lotes y movimientos.
4. Venta transaccional, FEFO e idempotencia.
5. Comprobantes simulados y reintentos.
6. Alertas, reportes, interfaz completa y aceptación integral.
