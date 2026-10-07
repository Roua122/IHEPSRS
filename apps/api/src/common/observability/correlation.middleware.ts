import type { NextFunction, Request, Response } from "express";

import {
  CORRELATION_ID_HEADER,
  normalizeOrCreateCorrelationId,
} from "./correlation-id";
import { runWithCorrelationId } from "./correlation-context";
import { writeStructuredLog } from "./structured-log";

export interface CorrelatedRequest extends Request {
  correlationId?: string;
}

export function correlationMiddleware(
  request: CorrelatedRequest,
  response: Response,
  next: NextFunction,
): void {
  const incoming = request.headers[CORRELATION_ID_HEADER];
  const correlationId = normalizeOrCreateCorrelationId(
    Array.isArray(incoming) ? incoming[0] : incoming,
  );

  request.correlationId = correlationId;
  response.setHeader(CORRELATION_ID_HEADER, correlationId);

  const startedAt = process.hrtime.bigint();

  runWithCorrelationId(correlationId, () => {
    writeStructuredLog({
      level: "info",
      event: "http.request.started",
      method: request.method,
      path: request.originalUrl ?? request.url,
    });

    response.on("finish", () => {
      const finishedAt = process.hrtime.bigint();
      const durationMs = Number(finishedAt - startedAt) / 1_000_000;

      writeStructuredLog({
        level: response.statusCode >= 500 ? "error" : "info",
        event: "http.request.completed",
        method: request.method,
        path: request.originalUrl ?? request.url,
        statusCode: response.statusCode,
        durationMs: Math.round(durationMs * 100) / 100,
        correlationId,
      });
    });

    next();
  });
}
