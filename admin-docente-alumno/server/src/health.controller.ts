import { Controller, Get, Header, ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Public } from './shared/infrastructure/security/decorators';

/** Readiness de la API: responde OK únicamente si PostgreSQL también responde. */
@Controller('health')
export class HealthController {
  constructor(private readonly database: DataSource) {}

  @Public()
  @Get()
  @Header('Cache-Control', 'no-store')
  async check(): Promise<{ status: 'ok' }> {
    try {
      await this.database.query('SELECT 1');
    } catch {
      // El endpoint público no expone credenciales ni detalles de conexión.
      throw new ServiceUnavailableException({ status: 'unavailable' });
    }
    return { status: 'ok' };
  }
}
