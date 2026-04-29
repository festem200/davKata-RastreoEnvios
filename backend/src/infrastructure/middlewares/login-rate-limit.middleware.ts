import { rateLimit } from 'express-rate-limit';

export const loginRateLimitMiddleware = rateLimit({
  legacyHeaders: false,
  limit: 5,
  message: { message: 'Demasiados intentos de login. Intenta nuevamente en un minuto' },
  standardHeaders: true,
  windowMs: 60_000
});
