import { HttpException, HttpStatus } from '@nestjs/common';

import type { ErrorCode } from './error-code';

export interface AppExceptionOptions {
  code: ErrorCode | string;
  message: string;
  status?: HttpStatus;
  details?: unknown;
}

export class AppException extends HttpException {
  readonly code: ErrorCode | string;
  readonly details?: unknown;

  constructor(options: AppExceptionOptions) {
    super(
      {
        code: options.code,
        message: options.message,
        details: options.details,
      },
      options.status ?? HttpStatus.BAD_REQUEST,
    );

    this.code = options.code;
    this.details = options.details;
  }
}
