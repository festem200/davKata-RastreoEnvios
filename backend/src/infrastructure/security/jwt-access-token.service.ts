import jwt, { type SignOptions } from 'jsonwebtoken';

import type {
  AccessTokenPayload,
  AccessTokenService
} from '../../application/ports/access-token-service.js';

export class JwtAccessTokenService implements AccessTokenService {
  constructor(
    private readonly jwtSecret: string,
    private readonly accessTokenExpiresIn: string
  ) {}

  sign(payload: AccessTokenPayload): string {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.accessTokenExpiresIn as SignOptions['expiresIn']
    });
  }
}
