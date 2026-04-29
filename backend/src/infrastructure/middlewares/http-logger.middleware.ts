import type { Request, Response } from 'express';
import { pinoHttp } from 'pino-http';
import { v4 as uuidv4 } from 'uuid';

import { logger } from '../helpers/logger/logger.js';

type HttpLogObject = Record<string, unknown>;

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

  const headerCorrelationId = request.get('x-correlation-id')?.trim();
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
