import { randomUUID } from "node:crypto";

export const CORRELATION_ID_HEADER = "x-correlation-id";

const MAX_CORRELATION_ID_LENGTH = 128;

export function normalizeOrCreateCorrelationId(value: unknown): string {
  if (typeof value === "string") {
    const normalized = value.trim();

    if (
      normalized.length > 0 &&
      normalized.length <= MAX_CORRELATION_ID_LENGTH
    ) {
      return normalized;
    }
  }

  return randomUUID();
}
