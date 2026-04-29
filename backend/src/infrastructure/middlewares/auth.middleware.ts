import type { NextFunction, Request, RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

import { USER_ROLES } from '../../domain/constants/user-role.js';
import { env } from '../config/env.js';
import type { AuthUser } from '../helpers/types-global/auth-user.js';

const bearerTokenSchema = z
  .string()
  .trim()
  .regex(/^Bearer\s+[A-Za-z0-9._-]+$/i)
  .transform((authorizationHeader) => authorizationHeader.replace(/^Bearer\s+/i, ''));

const authenticatedJwtPayloadSchema = z.object({
  sub: z.string().regex(/^\d+$/),
  email: z.string().email().max(254),
  role: z.enum(USER_ROLES)
});

type AuthenticatedJwtPayload = z.infer<typeof authenticatedJwtPayloadSchema>;

const getBearerToken = (authorizationHeader: string | undefined): string | null => {
  const parsedHeader = bearerTokenSchema.safeParse(authorizationHeader);

  if (!parsedHeader.success) {
    return null;
  }

  return parsedHeader.data;
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
    const parsedPayload = authenticatedJwtPayloadSchema.safeParse(payload);

    if (!parsedPayload.success) {
      response.status(401).json({ message: 'Token de autenticacion invalido' });
      return;
    }

    const authPayload: AuthenticatedJwtPayload = parsedPayload.data;
    const authUser: AuthUser = {
      id: authPayload.sub,
      email: authPayload.email,
      role: authPayload.role
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
