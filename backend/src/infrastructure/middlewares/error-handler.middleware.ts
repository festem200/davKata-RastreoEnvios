import type { ErrorRequestHandler } from 'express';

import { logger } from '../../utils/logger.js';

interface HttpParseError extends SyntaxError {
  status?: number;
  type?: string;
}

const isMalformedJsonError = (error: unknown): error is HttpParseError =>
  error instanceof SyntaxError &&
  typeof error === 'object' &&
  error !== null &&
  (error as HttpParseError).status === 400 &&
  (error as HttpParseError).type === 'entity.parse.failed';

export const errorHandlerMiddleware: ErrorRequestHandler = (error, request, response, _next) => {
  const code = isMalformedJsonError(error) ? 400 : 500;
  const message = code === 400 ? 'JSON invalido' : 'Error interno del servidor';
  const requestLogger = request.log ?? logger;
  const correlationId = request.correlationId;

  requestLogger.error(
    {
      code,
      correlationId,
      endpoint: request.originalUrl,
      err: error,
      method: request.method,
      statusCode: code
    },
    message
  );

  if (isMalformedJsonError(error)) {
    response.status(400).json({ message: 'JSON invalido' });
    return;
  }

  response.status(500).json({ message: 'Error interno del servidor' });
};
