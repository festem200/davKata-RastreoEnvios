import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { catchError, throwError } from 'rxjs';

import { AuthService } from '../../features/auth/services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        handleHttpError(error, request.url, authService);
      }

      return throwError(() => error);
    })
  );
};

const handleHttpError = (
  error: HttpErrorResponse,
  requestUrl: string,
  authService: AuthService
): void => {
  if (error.status === 401 && !requestUrl.includes('/auth/login')) {
    authService.logout();
    return;
  }

  if (error.status === 0) {
    console.error('No fue posible conectar con el servidor.', error);
    return;
  }

  if (error.status >= 500) {
    console.error('Error interno del servidor.', error);
  }
};
