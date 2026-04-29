import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, jest } from '@jest/globals';

import { correlationIdMiddleware } from '../../../../src/infrastructure/middlewares/correlation-id.middleware.js';

const createResponseMock = () => {
  const response = {
    setHeader: jest.fn()
  };

  return response as unknown as Response;
};

describe('correlationIdMiddleware', () => {
  it('preserves the x-correlation-id header when present', () => {
    const request = {
      get: jest.fn().mockReturnValue('client-correlation-id')
    } as unknown as Request;
    const response = createResponseMock();
    const next = jest.fn() as unknown as NextFunction;

    correlationIdMiddleware(request, response, next);

    expect(request.correlationId).toBe('client-correlation-id');
    expect(response.setHeader).toHaveBeenCalledWith('x-correlation-id', 'client-correlation-id');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('generates a correlationId when the request header is missing', () => {
    const request = {
      get: jest.fn().mockReturnValue(undefined)
    } as unknown as Request;
    const response = createResponseMock();
    const next = jest.fn() as unknown as NextFunction;

    correlationIdMiddleware(request, response, next);

    expect(request.correlationId).toEqual(expect.any(String));
    expect(request.correlationId).not.toHaveLength(0);
    expect(response.setHeader).toHaveBeenCalledWith('x-correlation-id', request.correlationId);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
