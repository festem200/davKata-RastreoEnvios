import type { NextFunction, Request, Response } from 'express';
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

describe('errorHandlerMiddleware', () => {
  it('maps malformed JSON errors to 400', () => {
    const error = new SyntaxError('Unexpected token') as SyntaxError & {
      status: number;
      type: string;
    };
    error.status = 400;
    error.type = 'entity.parse.failed';
    const response = createResponseMock();

    errorHandlerMiddleware(error, {} as Request, response, jest.fn() as unknown as NextFunction);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({ message: 'JSON invalido' });
  });

  it('maps unexpected errors to 500', () => {
    const response = createResponseMock();

    errorHandlerMiddleware(
      new Error('Database unavailable'),
      {} as Request,
      response,
      jest.fn() as unknown as NextFunction
    );

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({ message: 'Error interno del servidor' });
  });
});
