import type { NextFunction, Request, RequestHandler, Response } from 'express';

import type { UserRole } from '../../domain/constants/user-role.js';

export const roleMiddleware =
  (...allowedRoles: UserRole[]): RequestHandler =>
  (request: Request, response: Response, next: NextFunction) => {
    if (!request.user) {
      response.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    if (!allowedRoles.includes(request.user.role)) {
      request.log?.warn(
        {
          allowedRoles,
          correlationId: request.correlationId,
          endpoint: request.originalUrl,
          method: request.method,
          user: request.user
        },
        'Acceso denegado por rol'
      );
      response.status(403).json({ message: 'No autorizado' });
      return;
    }

    next();
  };
