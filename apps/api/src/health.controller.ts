import { Controller, Get } from '@nestjs/common';
import type { HealthResponse } from '@ihepsrs/contracts';

@Controller('health')
export class HealthController {
  @Get()
  getHealth(): HealthResponse {
    return {
      service: 'ihepsrs-api',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
