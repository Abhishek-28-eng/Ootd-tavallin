// ============================================================
// Authentication Types
// ============================================================

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  isEmailVerified: boolean;
  isOnboarded: boolean;
  isPrivate?: boolean;
  createdAt: string;
}

export type UserRole = 'user' | 'moderator' | 'admin' | 'super_admin';

export interface LoginResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface RegisterResponse {
  user: AuthUser;
  tokens: AuthTokens;
  message: string;
}

export interface RefreshTokenResponse {
  tokens: AuthTokens;
}

export interface JwtPayload {
  sub: string;       // user ID
  id?: string;
  email: string;
  username: string;
  role: UserRole;
  iat: number;
  exp: number;
  jti?: string;      // JWT ID for revocation
}

export interface PasswordResetPayload {
  sub: string;
  type: 'password_reset';
  iat: number;
  exp: number;
}

export interface EmailVerifyPayload {
  sub: string;
  type: 'email_verify';
  iat: number;
  exp: number;
}
