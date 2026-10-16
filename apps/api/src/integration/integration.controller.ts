import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    UseInterceptors,
  } from '@nestjs/common';
  
  import { IntegrationService } from './integration.service';
  import { IntegrationAttempt } from './integration-attempt.entity';
  import { IntegrationLoggerInterceptor } from './integration-logger.interceptor';
  
  @Controller('integration')
  @UseInterceptors(IntegrationLoggerInterceptor)
  export class IntegrationController {
    constructor(
      private readonly integrationService: IntegrationService,
    ) {}
  
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
      @Body()
      body: {
        messageId: string;
        errorCode: string;
        attemptNo: number;
      },
    ) {
      return this.integrationService.processFailure(
        body.messageId,
        body.errorCode,
        body.attemptNo,
      );
    }
  
    @Get('metrics')
    getMetrics() {
      return this.integrationService.getIntegrationMetrics();
    }
  }
  