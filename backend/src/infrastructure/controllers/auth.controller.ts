import type { Request, Response } from 'express';

import { InvalidCredentialsError } from '../../application/errors/invalid-credentials.error.js';
import type { LoginUseCase } from '../../application/use-cases/login.use-case.js';
import { loginRequestDtoSchema } from '../dtos/auth/login-request.dto.js';
import type { LoginResponseDto } from '../dtos/auth/login-response.dto.js';

export class AuthController {
  constructor(private readonly loginUseCase: LoginUseCase) {}

  login = async (request: Request, response: Response): Promise<void> => {
    const parsedBody = loginRequestDtoSchema.safeParse(request.body);

    if (!parsedBody.success) {
      response.status(400).json({ message: 'Credenciales invalidas' });
      return;
    }

    try {
      const result: LoginResponseDto = await this.loginUseCase.execute(parsedBody.data);

      response.json(result);
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        request.log?.warn(
          {
            correlationId: request.correlationId,
            email: parsedBody.data.email,
            endpoint: request.originalUrl,
            method: request.method,
            statusCode: 401
          },
          'Intento fallido de login'
        );
        response.status(401).json({ message: error.message });
        return;
      }

      throw error;
    }
  };
}
