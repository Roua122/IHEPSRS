import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import type { ApiErrorResponse } from '../errors/api-error-response';
import { AppException } from '../errors/app-exception';
import { ErrorCode } from '../errors/error-code';
import { errorCodeFromStatus } from '../errors/http-status-error-code';

interface HttpExceptionObject {
  code?: string;
  message?: string | string[];
  details?: unknown;
  error?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();

    const normalized = this.normalize(exception);
    const correlationId = this.readCorrelationId(request);

    const body: ApiErrorResponse = {
      timestamp: new Date().toISOString(),
      path: request.originalUrl ?? request.url,
      method: request.method,
      status: normalized.status,
      code: normalized.code,
      message: normalized.message,
      ...(correlationId ? { correlationId } : {}),
      ...(normalized.details !== undefined
        ? { details: normalized.details }
        : {}),
    };

    response.status(normalized.status).json(body);
  }

  private normalize(exception: unknown): {
    status: number;
    code: string;
    message: string;
    details?: unknown;
  } {
    if (exception instanceof AppException) {
      return {
        status: exception.getStatus(),
        code: exception.code,
        message: exception.message,
        details: exception.details,
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        return {
          status,
          code: errorCodeFromStatus(status),
          message: response,
        };
      }

      const object = response as HttpExceptionObject;
      const rawMessage = object.message;
      const message = Array.isArray(rawMessage)
        ? 'Request validation failed'
        : rawMessage ?? exception.message;

      return {
        status,
        code: object.code ?? errorCodeFromStatus(status),
        message,
        details:
          object.details ??
          (Array.isArray(rawMessage) ? rawMessage : undefined),
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ErrorCode.Internal,
      message: 'An unexpected server error occurred',
    };
  }

  private readCorrelationId(request: Request): string | undefined {
    const header = request.headers['x-correlation-id'];

    if (Array.isArray(header)) {
      return header[0];
    }

    return typeof header === 'string' && header.trim()
      ? header.trim()
      : undefined;
  }
}
