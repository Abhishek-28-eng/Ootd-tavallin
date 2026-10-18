import type { JwtPayload } from '@tavallin/shared';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & { id: string };
    }
  }
}
