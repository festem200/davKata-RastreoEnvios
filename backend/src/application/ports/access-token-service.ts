import type { UserRole } from '../../domain/constants/user-role.js';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface AccessTokenService {
  sign(payload: AccessTokenPayload): string;
}

