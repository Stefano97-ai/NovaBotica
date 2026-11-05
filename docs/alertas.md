# Centro de alertas

La migración aditiva `005_alertas.sql` crea `alerta`, `alerta_usuario` y `alerta_rol`. Los archivos de migración se conservan con sus bytes originales; la nueva migración tiene finales LF fijados en `.gitattributes`.

## Detección y ciclo de vida

- AGOTADO / CRITICA: producto activo con stock vendible igual a cero.
- STOCK_BAJO / MEDIA: stock vendible mayor que cero y menor o igual al mínimo.
- POR_VENCER / MEDIA: lote disponible de un producto activo, con existencias, entre 8 y 30 días hasta vencer.
- VENCIMIENTO_URGENTE / ALTA: vence hoy o en los próximos 7 días.
- VENCIDO / CRITICA: lote disponible con existencias cuya fecha de vencimiento ya pasó.

El stock vendible se calcula con `stock_disponible`: excluye lotes vencidos y no disponibles. Se utiliza siempre el calendario de `America/Lima`. Cambiar las ventanas también afecta el límite entre avisos normales y urgentes.

Hay como máximo una alerta activa de stock por producto y una alerta activa de vencimiento por lote, reforzado mediante índices únicos parciales. Una reconciliación con bloqueo transaccional compartido detecta candidatos usando un único snapshot y actualiza/resuelve/crea los episodios. Ejecuciones simultáneas no duplican alertas. Un problema que desaparece pasa a RESUELTA; si reaparece se crea otro episodio, conservando el anterior.

`datos` conserva el producto/código y las cifras que explican el aviso. `actualizada_en` cambia si cambian los datos; `version` solo aumenta al subir de prioridad. Leer guarda la versión vista por ese usuario: leer una versión antigua no oculta una posterior más grave. Leer no modifica stock ni resuelve avisos.

## Destinatarios y lectura

- Administrador y almacenero: todos los tipos.
- Vendedor: agotados, vencimientos urgentes y lotes vencidos.

Los destinatarios se guardan en `alerta_rol`. El backend obtiene el rol y usuario de la sesión y aplica los permisos también a conteos, filtros y escritura de lecturas. Nunca acepta un usuario destinatario proporcionado por el cliente. Se conserva la audiencia histórica de los episodios resueltos.

`alerta_usuario` tiene clave compuesta `(alerta_id,usuario_id)`, versión leída y fecha. Ausencia de fila significa no leída. La campana cuenta solamente episodios activos, visibles y no leídos. Muestra hasta cinco sin leer; al marcar todas se actúa sobre las activas visibles, no sobre el historial. Las prioridades son texto e icono además de color.

## Actualización

Ventas, anulaciones, recepciones, ajustes, nuevos lotes y cambios de catálogo publican un evento de inventario dentro de la transacción. Un listener AFTER_COMMIT inicia una reconciliación en una transacción nueva; un rollback no publica efectos de alerta. Un fallo de notificación se registra y no convierte una venta ya confirmada en una respuesta de error. La revisión periódica recupera cualquier evento no procesado.

Al iniciar el servidor web y cada 60 segundos se revisan de nuevo las condiciones. Esto cubre vencimientos por cambio de día, reinicios y operaciones externas que no publiquen eventos. Los comandos de migración sin servidor web no ejecutan el planificador.

Configuración opcional mediante entorno:

| Variable | Predeterminado |
|---|---|
| `ALERT_EXPIRY_DAYS` | 30 |
| `ALERT_URGENT_DAYS` | 7 |
| `ALERT_RECONCILE_MS` | 60000 |
| `ALERT_SCHEDULING_ENABLED` | true |

La web consulta al montar, cambiar de ruta, volver a primer plano y cada minuto mientras la pestaña sea visible. Mantiene el último resultado si falla una consulta y muestra que no pudo actualizarse; nunca sustituye un error por un contador cero. El usuario puede actualizar manualmente. Un producto abierto desde una alerta filtra el catálogo por su código.

## API

- `GET /api/alertas?estado=ACTIVA&tipo=TODAS&prioridad=TODAS&noLeidas=false&limit=25&offset=0`: devuelve `items`, total filtrado, `unreadCount` global de activas visibles, paginación y `checkedAt`.
- `PUT /api/alertas/{id}/lectura` con `{"version":1}`: lectura individual de esa versión; no permite marcar versiones futuras ni avisos ajenos al rol.
- `PUT /api/alertas/lecturas`: marca como leídas las versiones actuales de todas las alertas activas visibles, en un único snapshot.

Filtros válidos: estados ACTIVA/RESUELTA/TODAS, los cinco tipos o TODAS y prioridades MEDIA/ALTA/CRITICA/TODAS. Tamaño de página entre 1 y 100. El historial completo se consulta en `/alertas`. No hay acción manual de resolver: primero se corrige la situación de inventario.

## Pruebas

```powershell
mvn -B -f backend/pom.xml -Dtest=AlertaIntegrationTest,VentaSeriesIntegrationTest,InicioChartsIntegrationTest test
node --test frontend/tests/alertas.test.mjs frontend/tests/ventas-totals.test.mjs frontend/tests/ventas-payments-series.test.mjs
npm run check:architecture --workspace frontend
```

Se comprueban deduplicación, reaparición, escalado de prioridad, lectura individual/versionada, roles, filtros, paginación, límites de vencimiento, productos inactivos, lotes vacíos/no disponibles, reconciliación concurrente y efectos solo después de commit. PostgreSQL de pruebas es temporal y separado de la base local.
