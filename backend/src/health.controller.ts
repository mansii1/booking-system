import { Controller, Get } from '@nestjs/common';
import { pool } from './postgres';

@Controller()
export class HealthController {
  @Get('health')
  async health() {
    await pool.query('SELECT 1');
    return { ok: true };
  }
}
