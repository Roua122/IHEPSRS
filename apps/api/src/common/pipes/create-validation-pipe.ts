import { HttpStatus, ValidationPipe } from "@nestjs/common";

import { AppException } from "../errors/app-exception";
import { ErrorCode } from "../errors/error-code";
import { flattenValidationErrors } from "../errors/validation-error-details";

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) =>
      new AppException({
        status: HttpStatus.BAD_REQUEST,
        code: ErrorCode.Validation,
        message: "Request validation failed",
        details: flattenValidationErrors(errors),
      }),
  });
}
