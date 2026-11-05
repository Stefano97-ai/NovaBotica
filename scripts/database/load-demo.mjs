import { readFile } from 'node:fs/promises';
import pg from 'pg';

// Explicit manual command. Never invoked during application startup or deployment.
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('Define DATABASE_URL con la base de destino antes de cargar los datos.');
  process.exit(1);
}

const client = new pg.Client({ connectionString: databaseUrl });
let connected = false;
try {
  await client.connect();
  connected = true;
  // Keep both seed files in one transaction, including their validation blocks.
  const parts = await Promise.all(['seed-demo.sql', 'seed-demo-series.sql'].map(async file => {
    const sql = await readFile(new URL(file, import.meta.url), 'utf8');
    return sql.replace(/^\\set ON_ERROR_STOP on\s*$/gm, '')
      .replace(/^BEGIN;\s*$/gm, '').replace(/^COMMIT;\s*$/gm, '');
  }));
  await client.query('BEGIN');
  await client.query("SET LOCAL lock_timeout = '15s'");
  await client.query(parts.join('\n'));
  const result = await client.query(`
    SELECT 'productos_demo' AS registro, count(*)::int AS cantidad FROM producto WHERE codigo LIKE 'DEMO-NS-%'
    UNION ALL SELECT 'lotes_demo', count(*)::int FROM lote WHERE numero_lote LIKE 'DEMO-NS-%'
    UNION ALL SELECT 'ventas_demo', count(*)::int FROM venta WHERE solicitud_hash=repeat('d',64)
    UNION ALL SELECT 'series_demo', count(*)::int FROM unidad_serializada WHERE numero_serie LIKE 'DEMO-TERM-%'
  `);
  await client.query('COMMIT');
  console.log('Carga de demostración completada. Los conjuntos existentes se conservan.');
  console.table(result.rows);
} catch (error) {
  if (connected) await client.query('ROLLBACK').catch(() => {});
  // Database error messages may contain connection details or record contents.
  console.error(`No se completó la carga (código ${error.code ?? 'desconocido'}). Comprueba conexión, migraciones y usuarios administrador/vendedor activos. No se guardaron cambios parciales.`);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
