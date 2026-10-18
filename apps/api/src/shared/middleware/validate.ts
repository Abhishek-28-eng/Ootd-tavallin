import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { AppError } from '../errors/AppError';
import { ErrorCodes } from '@tavallin/shared';

type ValidationTarget = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const details = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
        code: e.code,
      }));
      next(
        AppError.badRequest('Validation failed', ErrorCodes.VALIDATION_ERROR, details),
      );
      return;
    }
    // Assign parsed/coerced data back to request
    (req as unknown as Record<string, unknown>)[target] = result.data;
    next();
  };
}
