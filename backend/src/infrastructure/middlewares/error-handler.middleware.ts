import type { ErrorRequestHandler } from 'express';

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

export const errorHandlerMiddleware: ErrorRequestHandler = (error, _request, response, _next) => {
  if (isMalformedJsonError(error)) {
    response.status(400).json({ message: 'JSON invalido' });
    return;
  }

  response.status(500).json({ message: 'Error interno del servidor' });
};
