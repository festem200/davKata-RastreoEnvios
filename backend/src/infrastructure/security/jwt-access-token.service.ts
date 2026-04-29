import jwt from 'jsonwebtoken';

import type {
  AccessTokenPayload,
  AccessTokenService
} from '../../application/ports/access-token-service.js';
import { ACCESS_TOKEN_EXPIRES_IN } from '../../application/use-cases/login.use-case.js';

export class JwtAccessTokenService implements AccessTokenService {
  constructor(private readonly jwtSecret: string) {}

  sign(payload: AccessTokenPayload): string {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN
    });
  }
}

