import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool, PoolClient, QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly pool: Pool;

  constructor() {
    if (!process.env.DATABASE_URL) throw new Error('Falta DATABASE_URL en backend/.env');
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      statement_timeout: 15000,
      options: '-c timezone=America/Lima',
    });
    this.pool.on('error', () => this.logger.error('Error en una conexión inactiva de PostgreSQL'));
  }

  async onModuleInit() {
    try { await this.pool.query('SELECT 1'); }
    catch { await this.pool.end(); throw new Error('No se pudo conectar con PostgreSQL. Revisa DATABASE_URL y el servidor.'); }
  }

  query<T extends QueryResultRow = QueryResultRow>(sql: string, params: unknown[] = []) {
    return this.pool.query<T>(sql, params);
  }

  async transaction<T>(operation: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    let broken = false;
    try {
      await client.query('BEGIN');
      const result = await operation(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch { broken = true; }
      throw error;
    } finally {
      client.release(broken);
    }
  }

  async onModuleDestroy() { await this.pool.end(); }
}
