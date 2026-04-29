import type { UserRole } from '../../../domain/constants/user-role.js';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

