import { HttpStatus } from '@nestjs/common';

import { ErrorCode } from './error-code';

export function errorCodeFromStatus(status: number): string {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return ErrorCode.BadRequest;
    case HttpStatus.UNAUTHORIZED:
      return ErrorCode.Unauthorized;
    case HttpStatus.FORBIDDEN:
      return ErrorCode.Forbidden;
    case HttpStatus.NOT_FOUND:
      return ErrorCode.NotFound;
    case HttpStatus.CONFLICT:
      return ErrorCode.Conflict;
    case HttpStatus.TOO_MANY_REQUESTS:
      return ErrorCode.TooManyRequests;
    case HttpStatus.SERVICE_UNAVAILABLE:
      return ErrorCode.ServiceUnavailable;
    default:
      return status >= 500 ? ErrorCode.Internal : `HTTP_${status}`;
  }
}
