import type { ErrorCode } from '@tavallin/shared';
import type { ValidationDetail } from '@tavallin/shared';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: ValidationDetail[];
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    code: ErrorCode,
    details?: ValidationDetail[],
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    if (details !== undefined) {
      this.details = details;
    }
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, code: ErrorCode = 'VALIDATION_ERROR', details?: ValidationDetail[]): AppError {
    return new AppError(message, 400, code, details);
  }

  static unauthorized(message = 'Authentication required', code: ErrorCode = 'UNAUTHORIZED'): AppError {
    return new AppError(message, 401, code);
  }

  static forbidden(message = 'You do not have permission to perform this action', code: ErrorCode = 'FORBIDDEN'): AppError {
    return new AppError(message, 403, code);
  }

  static notFound(message = 'Resource not found', code: ErrorCode = 'NOT_FOUND'): AppError {
    return new AppError(message, 404, code);
  }

  static conflict(message: string, code: ErrorCode): AppError {
    return new AppError(message, 409, code);
  }

  static internal(message = 'Internal server error'): AppError {
    return new AppError(message, 500, 'INTERNAL_ERROR');
  }
}
