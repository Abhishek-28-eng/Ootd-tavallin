// ============================================================
// API Response Types
// Consistent envelope for all API responses
// ============================================================

export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ValidationDetail[];
  };
}

export type ApiResult<T = unknown> = ApiResponse<T> | ApiError;

export interface PaginationMeta {
  total?: number;
  page?: number;
  limit?: number;
  hasMore: boolean;
  cursor?: string | null;
  nextCursor?: string | null;
}

export interface ValidationDetail {
  field: string;
  message: string;
  code?: string;
}

export interface CursorPaginationParams {
  cursor?: string;
  limit?: number;
}

export interface OffsetPaginationParams {
  page?: number;
  limit?: number;
}

export interface SearchParams extends CursorPaginationParams {
  q: string;
  type?: 'outfits' | 'users' | 'tags' | 'all';
}
