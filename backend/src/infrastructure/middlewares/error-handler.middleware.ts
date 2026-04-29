import type { ErrorRequestHandler } from 'express';
import multer from 'multer';

import { logger } from '../helpers/logger/logger.js';

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

const isMulterError = (error: unknown): error is multer.MulterError =>
  error instanceof multer.MulterError;

const resolveErrorResponse = (error: unknown) => {
  if (isMalformedJsonError(error)) {
    return { code: 400, message: 'JSON invalido' };
  }

  if (isMulterError(error)) {
    return { code: 400, message: 'Archivo CSV invalido' };
  }

  return { code: 500, message: 'Error interno del servidor' };
};

export const errorHandlerMiddleware: ErrorRequestHandler = (error, request, response, _next) => {
  const { code, message } = resolveErrorResponse(error);
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

  response.status(code).json({ message });
};
