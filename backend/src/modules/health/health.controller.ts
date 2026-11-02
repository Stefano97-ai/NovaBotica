import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { DatabaseService } from '../../shared/database/database.service';
import { Public } from '../auth/auth.guard';

@Controller('health')
@Public()
export class HealthController {
  constructor(private readonly database: DatabaseService) {}

  @Get()
  check() { return { status: 'ok', service: 'nova-salud-api', scope: 'process-only' }; }

  @Get('db')
  async checkDatabase() {
    try {
      await this.database.query('SELECT 1');
      const result = await this.database.query<{ version: string }>('SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1');
      if (!result.rows.length) throw new Error('Sin migraciones');
      return { status: 'ok', database: 'connected', migration: result.rows[0].version };
    } catch {
      throw new ServiceUnavailableException('Base de datos no disponible o pendiente de migración');
    }
  }
}
