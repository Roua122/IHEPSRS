import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'node:path';

import { ConfigurationModule } from './config/configuration.module';
import { validateEnvironment } from './config/environment';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: [
        resolve(process.cwd(), '../../.env'),
        resolve(process.cwd(), '.env'),
      ],
      validate: validateEnvironment,
    }),
    ConfigurationModule,
  ],
  controllers: [HealthController],
})
export class AppModule { }