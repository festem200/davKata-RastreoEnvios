import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().max(65_535).default(3000),
  CORS_ORIGIN: z.string().url().default('http://localhost:4200'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  TRACKING_SOAP_URL: z.string().url().default('http://localhost:8088/mockTrackingBinding')
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
  databaseUrl: parsedEnv.data.DATABASE_URL,
  jwtSecret: parsedEnv.data.JWT_SECRET,
  trackingSoapUrl: parsedEnv.data.TRACKING_SOAP_URL
};
