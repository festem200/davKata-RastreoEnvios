import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().max(65_535),
  CORS_ORIGIN: z
    .string()
    .trim()
    .refine((origin) => origin !== '*', {
      message: 'CORS_ORIGIN must be an explicit URL, not *'
    })
    .pipe(z.string().url()),
  CSV_UPLOAD_MAX_BYTES: z.coerce.number().int().positive(),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_ACCESS_TOKEN_EXPIRES_IN: z.string().min(1),
  LOGIN_RATE_LIMIT_MAX_ATTEMPTS: z.coerce.number().int().positive(),
  LOGIN_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']),
  TRACKING_CACHE_TTL_MS: z.coerce.number().int().positive(),
  TRACKING_SOAP_URL: z.string().url()
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const message = parsedEnv.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');

  throw new Error(`Invalid environment configuration: ${message}`);
}

export const env = {
  port: parsedEnv.data.PORT,
  corsOrigin: parsedEnv.data.CORS_ORIGIN,
  csvUploadMaxBytes: parsedEnv.data.CSV_UPLOAD_MAX_BYTES,
  databaseUrl: parsedEnv.data.DATABASE_URL,
  jwtAccessTokenExpiresIn: parsedEnv.data.JWT_ACCESS_TOKEN_EXPIRES_IN,
  jwtSecret: parsedEnv.data.JWT_SECRET,
  loginRateLimitMaxAttempts: parsedEnv.data.LOGIN_RATE_LIMIT_MAX_ATTEMPTS,
  loginRateLimitWindowMs: parsedEnv.data.LOGIN_RATE_LIMIT_WINDOW_MS,
  logLevel: parsedEnv.data.LOG_LEVEL,
  trackingCacheTtlMs: parsedEnv.data.TRACKING_CACHE_TTL_MS,
  trackingSoapUrl: parsedEnv.data.TRACKING_SOAP_URL
};
