import type { NextFunction, Request, RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';

import { USER_ROLES, type UserRole } from '../../domain/constants/user-role.js';
import { env } from '../config/env.js';
import type { AuthUser } from '../helpers/types-global/auth-user.js';

interface AuthenticatedJwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

const isUserRole = (role: unknown): role is UserRole =>
  typeof role === 'string' && USER_ROLES.includes(role as UserRole);

const isAuthenticatedPayload = (payload: unknown): payload is AuthenticatedJwtPayload => {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }

  const candidate = payload as Record<string, unknown>;

  return (
    typeof candidate.sub === 'string' &&
    typeof candidate.email === 'string' &&
    isUserRole(candidate.role)
  );
};

const getBearerToken = (authorizationHeader: string | undefined): string | null => {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(' ');

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
};

export const authMiddleware: RequestHandler = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const token = getBearerToken(request.get('authorization'));

  if (!token) {
    response.status(401).json({ message: 'Token de autenticacion requerido' });
    return;
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);

    if (!isAuthenticatedPayload(payload)) {
      response.status(401).json({ message: 'Token de autenticacion invalido' });
      return;
    }

    const authUser: AuthUser = {
      id: payload.sub,
      email: payload.email,
      role: payload.role
    };

    request.user = authUser;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      response.status(401).json({ message: 'Token de autenticacion expirado' });
      return;
    }

    response.status(401).json({ message: 'Token de autenticacion invalido' });
  }
};
