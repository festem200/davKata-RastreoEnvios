import type { RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';

const CORRELATION_ID_HEADER = 'x-correlation-id';

export const correlationIdMiddleware: RequestHandler = (request, response, next) => {
  const incomingCorrelationId = request.get(CORRELATION_ID_HEADER)?.trim();
  const correlationId = incomingCorrelationId || uuidv4();

  request.correlationId = correlationId;
  response.setHeader(CORRELATION_ID_HEADER, correlationId);

  next();
};
