export const ErrorCode = {
  Validation: "VALIDATION_ERROR",
  BadRequest: "BAD_REQUEST",
  Unauthorized: "UNAUTHORIZED",
  Forbidden: "FORBIDDEN",
  NotFound: "NOT_FOUND",
  Conflict: "CONFLICT",
  TooManyRequests: "TOO_MANY_REQUESTS",
  Internal: "INTERNAL_ERROR",
  ServiceUnavailable: "SERVICE_UNAVAILABLE",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
