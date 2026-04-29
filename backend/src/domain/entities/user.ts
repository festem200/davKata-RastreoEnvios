import type { UserRole } from '../constants/user-role.js';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
}

