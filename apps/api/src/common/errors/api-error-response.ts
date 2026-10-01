import type { ErrorCode } from './error-code';

export interface ApiErrorResponse {
  timestamp: string;
  path: string;
  method: string;
  status: number;
  code: ErrorCode | string;
  message: string;
  correlationId?: string;
  details?: unknown;
}
