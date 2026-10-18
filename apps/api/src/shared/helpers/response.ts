import type { Response } from 'express';
import type { ApiResponse, PaginationMeta } from '@tavallin/shared';

export function sendSuccess<T>(
  res: Response,
  data: T,
  options?: {
    statusCode?: number;
    message?: string;
    meta?: PaginationMeta;
  },
): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(options?.message ? { message: options.message } : {}),
    ...(options?.meta ? { meta: options.meta } : {}),
  };
  res.status(options?.statusCode ?? 200).json(response);
}

export function respond<T>(
  res: Response,
  statusCode = 200,
  data?: T,
  message?: string,
  meta?: PaginationMeta,
): void {
  const response: ApiResponse<T> = {
    success: true,
    data: (data !== undefined ? data : null) as T,
    ...(message ? { message } : {}),
    ...(meta ? { meta } : {}),
  };
  res.status(statusCode).json(response);
}
