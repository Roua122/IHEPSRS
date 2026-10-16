import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
  } from '@nestjs/common';
  import { Observable } from 'rxjs';
  import { tap } from 'rxjs/operators';
  import { Request, Response } from 'express';
  
  @Injectable()
  export class IntegrationLoggerInterceptor implements NestInterceptor {
    private readonly logger = new Logger('IntegrationObservability');
  
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const ctx = context.switchToHttp();
      const request = ctx.getRequest<Request>();
      const response = ctx.getResponse<Response>();
  
      // استخراج أو توليد Correlation ID (متوافق مع FND004)
      const correlationId =
        (request.headers['x-correlation-id'] as string) ||
        `corr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  
      response.setHeader('x-correlation-id', correlationId);
  
      const startTime = Date.now();
      const { method, url, body } = request;
  
      this.logger.log(
        `[INBOUND] [${correlationId}] ${method} ${url} - Payload: ${JSON.stringify(body)}`,
      );
  
      return next.handle().pipe(
        tap({
          next: (data) => {
            const durationMs = Date.now() - startTime;
            this.logger.log(
              `[OUTBOUND-SUCCESS] [${correlationId}] ${method} ${url} - Duration: ${durationMs}ms`,
            );
          },
          error: (error) => {
            const durationMs = Date.now() - startTime;
            this.logger.error(
              `[OUTBOUND-ERROR] [${correlationId}] ${method} ${url} - Duration: ${durationMs}ms - Error: ${error.message}`,
            );
          },
        }),
      );
    }
  }
  