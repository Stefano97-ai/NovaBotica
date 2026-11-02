import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import pg from 'pg';
import { connectionUrl } from './db-config.mjs';

const client = new pg.Client({ connectionString: connectionUrl(), connectionTimeoutMillis: 5000 });
let locked = false;
try {
  await client.connect();
  await client.query('SELECT pg_advisory_lock(5272026)');
  locked = true;
  await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now()
  )`);
  const directory = new URL('../database/migrations/', import.meta.url);
  for (const file of (await readdir(directory)).filter(name => name.endsWith('.sql')).sort()) {
    const sql = await readFile(new URL(file, directory), 'utf8');
    const checksum = createHash('sha256').update(sql).digest('hex');
    const existing = await client.query('SELECT checksum FROM schema_migrations WHERE version=$1', [file]);
    if (existing.rows.length) {
      if (existing.rows[0].checksum !== checksum) throw new Error(`Migración ya aplicada fue modificada: ${file}`);
      console.log(`Ya aplicada: ${file}`);
      continue;
    }
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations(version, checksum) VALUES ($1,$2)', [file, checksum]);
      await client.query('COMMIT');
      console.log(`Aplicada: ${file}`);
    } catch(error) { await client.query('ROLLBACK'); throw error; }
  }
} catch(error) { console.error(error.message); process.exitCode=1; }
finally {
  if (locked) await client.query('SELECT pg_advisory_unlock(5272026)').catch(()=>{});
  await client.end();
}
