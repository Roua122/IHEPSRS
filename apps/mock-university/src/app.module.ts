import { Module } from '@nestjs/common';

import { HealthController } from './health.controller';
import { StudentsController } from './students.controller';

@Module({
  controllers: [HealthController, StudentsController],
})
export class AppModule {}
