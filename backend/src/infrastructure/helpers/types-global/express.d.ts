import type { AuthUser } from './auth-user.js';

declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
      user?: AuthUser;
    }
  }
}

export {};
