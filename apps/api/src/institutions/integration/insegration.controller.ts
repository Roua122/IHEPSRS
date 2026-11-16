import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { IntegrationService } from './integration.service';
import { IntegrationAttempt } from './integration-attempt.entity';

@Controller('integration')
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Post('attempt')
  logAttempt(@Body() attemptData: Partial<IntegrationAttempt>) {
    return this.integrationService.logAttempt(attemptData);
  }

  @Get('attempts/:messageId')
  getAttempts(@Param('messageId') messageId: string) {
    return this.integrationService.getAttemptsByMessage(messageId);
  }

  @Post('process-failure')
  processFailure(
    @Body() body: { messageId: string; errorCode: string; attemptNo: number },
  ) {
    return this.integrationService.processFailure(
      body.messageId,
      body.errorCode,
      body.attemptNo,
    );
  }
}
