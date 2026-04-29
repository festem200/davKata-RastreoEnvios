import type { RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const CORRELATION_ID_HEADER = 'x-correlation-id';
const correlationIdHeaderSchema = z
  .string()
  .trim()
  .max(128)
  .regex(/^[A-Za-z0-9._-]+$/);

const parseCorrelationId = (value: string | undefined): string | null => {
  const parsedValue = correlationIdHeaderSchema.safeParse(value);

  return parsedValue.success ? parsedValue.data : null;
};

export const correlationIdMiddleware: RequestHandler = (request, response, next) => {
  const incomingCorrelationId = parseCorrelationId(request.get(CORRELATION_ID_HEADER));
  const correlationId = incomingCorrelationId || uuidv4();

  request.correlationId = correlationId;
  response.setHeader(CORRELATION_ID_HEADER, correlationId);

  next();
};
