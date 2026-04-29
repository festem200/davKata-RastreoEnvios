import { Router } from 'express';

import { LoginUseCase } from '../../application/use-cases/login.use-case.js';
import { env } from '../config/env.js';
import { AuthController } from '../controllers/auth.controller.js';
import { loginRateLimitMiddleware } from '../middlewares/login-rate-limit.middleware.js';
import { PrismaUserRepository } from '../repositories/prisma-user.repository.js';
import { BcryptPasswordHasher } from '../security/bcrypt-password-hasher.js';
import { JwtAccessTokenService } from '../security/jwt-access-token.service.js';

export const createAuthRouter = (): Router => {
  const router = Router();
  const userRepository = new PrismaUserRepository();
  const passwordHasher = new BcryptPasswordHasher();
  const accessTokenService = new JwtAccessTokenService(env.jwtSecret);
  const loginUseCase = new LoginUseCase(userRepository, passwordHasher, accessTokenService);
  const authController = new AuthController(loginUseCase);

  router.post('/login', loginRateLimitMiddleware, authController.login);

  return router;
};
