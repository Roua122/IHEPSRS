import { Module } from '@nestjs/common';

import { BusinessPolicyService } from './business-policy.service';
import { ConfigStatusController } from './config-status.controller';

@Module({
  controllers: [ConfigStatusController],
  providers: [BusinessPolicyService],
  exports: [BusinessPolicyService],
})
export class ConfigurationModule {}
