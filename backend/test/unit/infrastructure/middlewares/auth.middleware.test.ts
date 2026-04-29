import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { describe, expect, it, jest } from '@jest/globals';

process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET ??= 'unit-test-secret';

const { authMiddleware } = await import(
  '../../../../src/infrastructure/middlewares/auth.middleware.js'
);
const { roleMiddleware } = await import(
  '../../../../src/infrastructure/middlewares/role.middleware.js'
);

const createResponseMock = () => {
  const response = {
    status: jest.fn(),
    json: jest.fn()
  };

  response.status.mockReturnValue(response);
  response.json.mockReturnValue(response);

  return response as unknown as Response;
};

const createRequestMock = (authorization?: string) =>
  ({
    get: jest.fn((name: string) => {
      if (name.toLowerCase() === 'authorization') {
        return authorization;
      }

      return undefined;
    })
  }) as unknown as Request;

describe('authMiddleware', () => {
  it('attaches the authenticated user for valid bearer tokens', () => {
    const token = jwt.sign(
      {
        sub: '1',
        email: 'admin@test.com',
        role: 'ADMIN'
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '8h' }
    );
    const request = createRequestMock(`Bearer ${token}`);
    const response = createResponseMock();
    const next = jest.fn() as unknown as NextFunction;

    authMiddleware(request, response, next);

    expect(request.user).toEqual({
      id: '1',
      email: 'admin@test.com',
      role: 'ADMIN'
    });
    expect(next).toHaveBeenCalledTimes(1);
    expect(response.status).not.toHaveBeenCalled();
  });

  it('returns 401 when bearer token is missing', () => {
    const request = createRequestMock();
    const response = createResponseMock();
    const next = jest.fn() as unknown as NextFunction;

    authMiddleware(request, response, next);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({ message: 'Token de autenticacion requerido' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token payload is invalid', () => {
    const token = jwt.sign({ sub: '1', email: 'admin@test.com' }, process.env.JWT_SECRET as string);
    const request = createRequestMock(`Bearer ${token}`);
    const response = createResponseMock();
    const next = jest.fn() as unknown as NextFunction;

    authMiddleware(request, response, next);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({ message: 'Token de autenticacion invalido' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token is expired', () => {
    const token = jwt.sign(
      {
        sub: '1',
        email: 'admin@test.com',
        role: 'ADMIN'
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '-1s' }
    );
    const request = createRequestMock(`Bearer ${token}`);
    const response = createResponseMock();
    const next = jest.fn() as unknown as NextFunction;

    authMiddleware(request, response, next);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({ message: 'Token de autenticacion expirado' });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('roleMiddleware', () => {
  it('allows authenticated users with an allowed role', () => {
    const request = {
      user: {
        id: '1',
        email: 'admin@test.com',
        role: 'ADMIN'
      }
    } as Request;
    const response = createResponseMock();
    const next = jest.fn() as unknown as NextFunction;

    roleMiddleware('ADMIN')(request, response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(response.status).not.toHaveBeenCalled();
  });

  it('returns 403 for authenticated users without an allowed role', () => {
    const request = {
      user: {
        id: '2',
        email: 'operador@test.com',
        role: 'OPERADOR'
      },
      log: {
        warn: jest.fn()
      },
      method: 'POST',
      originalUrl: '/api/routes'
    } as Request;
    const response = createResponseMock();
    const next = jest.fn() as unknown as NextFunction;

    roleMiddleware('ADMIN')(request, response, next);

    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.json).toHaveBeenCalledWith({ message: 'No autorizado' });
    expect(request.log?.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        allowedRoles: ['ADMIN'],
        endpoint: '/api/routes',
        method: 'POST'
      }),
      'Acceso denegado por rol'
    );
    expect(next).not.toHaveBeenCalled();
  });
});
