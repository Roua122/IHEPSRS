import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Request, Response } from "express";

import type { ApiErrorResponse } from "../errors/api-error-response";
import { AppException } from "../errors/app-exception";
import { ErrorCode } from "../errors/error-code";
import { errorCodeFromStatus } from "../errors/http-status-error-code";
import type { CorrelatedRequest } from "../observability/correlation.middleware";
import { getCorrelationId } from "../observability/correlation-context";
import { writeStructuredLog } from "../observability/structured-log";

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
    const request = context.getRequest<CorrelatedRequest>();
    const response = context.getResponse<Response>();

    const normalized = this.normalize(exception);

    const correlationId =
      request.correlationId ??
      getCorrelationId() ??
      this.readCorrelationId(request);

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

    writeStructuredLog({
      level: normalized.status >= 500 ? "error" : "warn",
      event: "http.request.failed",
      message: normalized.message,
      method: request.method,
      path: request.originalUrl ?? request.url,
      statusCode: normalized.status,
      code: normalized.code,
      correlationId,
    });

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

      if (typeof response === "string") {
        return {
          status,
          code: errorCodeFromStatus(status),
          message: response,
        };
      }

      const object = response as HttpExceptionObject;
      const rawMessage = object.message;

      const message = Array.isArray(rawMessage)
        ? "Request validation failed"
        : (rawMessage ?? exception.message);

      return {
        status,
        code: object.code ?? errorCodeFromStatus(status),
        message,
        details:
          object.details ??
          (Array.isArray(rawMessage) ? rawMessage : undefined),
      };
    }

    // Do not expose internal error details to clients.
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ErrorCode.Internal,
      message: "An unexpected server error occurred",
    };
  }

  private readCorrelationId(request: Request): string | undefined {
    const header = request.headers["x-correlation-id"];

    if (Array.isArray(header)) {
      return header[0];
    }

    return typeof header === "string" && header.trim()
      ? header.trim()
      : undefined;
  }
}
