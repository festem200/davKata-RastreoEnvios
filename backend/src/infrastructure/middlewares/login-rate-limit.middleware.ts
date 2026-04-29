import { rateLimit } from 'express-rate-limit';

import { env } from '../config/env.js';

export const loginRateLimitMiddleware = rateLimit({
  legacyHeaders: false,
  limit: env.loginRateLimitMaxAttempts,
  message: { message: 'Demasiados intentos de login. Intenta nuevamente en un minuto' },
  standardHeaders: true,
  windowMs: env.loginRateLimitWindowMs
});
