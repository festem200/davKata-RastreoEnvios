import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { describe, expect, it, jest } from '@jest/globals';

import { errorHandlerMiddleware } from '../../../../src/infrastructure/middlewares/error-handler.middleware.js';

const createResponseMock = () => {
  const response = {
    status: jest.fn(),
    json: jest.fn()
  };

  response.status.mockReturnValue(response);
  response.json.mockReturnValue(response);

  return response as unknown as Response;
};

const createRequestMock = () =>
  ({
    correlationId: 'test-correlation-id',
    log: {
      error: jest.fn()
    },
    method: 'GET',
    originalUrl: '/api/routes'
  }) as unknown as Request;

describe('errorHandlerMiddleware', () => {
  it('maps malformed JSON errors to 400', () => {
    const error = new SyntaxError('Unexpected token') as SyntaxError & {
      status: number;
      type: string;
    };
    error.status = 400;
    error.type = 'entity.parse.failed';
    const request = createRequestMock();
    const response = createResponseMock();

    errorHandlerMiddleware(error, request, response, jest.fn() as unknown as NextFunction);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({ message: 'JSON invalido' });
    expect(request.log.error).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 400,
        correlationId: 'test-correlation-id',
        endpoint: '/api/routes',
        method: 'GET'
      }),
      'JSON invalido'
    );
  });

  it('maps unexpected errors to 500', () => {
    const request = createRequestMock();
    const response = createResponseMock();

    errorHandlerMiddleware(
      new Error('Database unavailable'),
      request,
      response,
      jest.fn() as unknown as NextFunction
    );

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({ message: 'Error interno del servidor' });
    expect(request.log.error).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 500,
        correlationId: 'test-correlation-id',
        endpoint: '/api/routes',
        method: 'GET'
      }),
      'Error interno del servidor'
    );
  });

  it('maps CSV upload errors to 400', () => {
    const request = createRequestMock();
    const response = createResponseMock();

    errorHandlerMiddleware(
      new multer.MulterError('LIMIT_FILE_SIZE', 'file'),
      request,
      response,
      jest.fn() as unknown as NextFunction
    );

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({ message: 'Archivo CSV invalido' });
    expect(request.log.error).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 400,
        correlationId: 'test-correlation-id',
        endpoint: '/api/routes',
        method: 'GET'
      }),
      'Archivo CSV invalido'
    );
  });
});
