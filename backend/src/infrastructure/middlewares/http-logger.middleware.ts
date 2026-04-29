import type { Request, Response } from 'express';
import { pinoHttp } from 'pino-http';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

import { logger } from '../helpers/logger/logger.js';

type HttpLogObject = Record<string, unknown>;
const correlationIdHeaderSchema = z
  .string()
  .trim()
  .max(128)
  .regex(/^[A-Za-z0-9._-]+$/);

const toHttpLogObject = (value: unknown): HttpLogObject => {
  if (typeof value === 'object' && value !== null) {
    return value as HttpLogObject;
  }

  return {};
};

const resolveCorrelationId = (request: Request): string => {
  if (request.correlationId) {
    return request.correlationId;
  }

  const parsedHeaderCorrelationId = correlationIdHeaderSchema.safeParse(
    request.get('x-correlation-id')
  );
  const headerCorrelationId = parsedHeaderCorrelationId.success
    ? parsedHeaderCorrelationId.data
    : null;
  const correlationId = headerCorrelationId || uuidv4();

  request.correlationId = correlationId;

  return correlationId;
};

export const httpLoggerMiddleware = pinoHttp<Request, Response>({
  customAttributeKeys: {
    reqId: 'correlationId',
    responseTime: 'responseTime'
  },
  customErrorObject: (
    request: Request,
    response: Response,
    _error: Error,
    logObject: unknown
  ) => ({
    ...toHttpLogObject(logObject),
    code: response.statusCode,
    correlationId: resolveCorrelationId(request),
    endpoint: request.originalUrl,
    method: request.method,
    statusCode: response.statusCode
  }),
  customProps: (request: Request) => ({
    correlationId: resolveCorrelationId(request)
  }),
  customSuccessObject: (request: Request, response: Response, logObject: unknown) => ({
    ...toHttpLogObject(logObject),
    code: response.statusCode,
    correlationId: resolveCorrelationId(request),
    endpoint: request.originalUrl,
    method: request.method,
    statusCode: response.statusCode
  }),
  genReqId: resolveCorrelationId,
  logger
});
