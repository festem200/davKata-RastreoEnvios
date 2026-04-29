import type { User } from '../entities/user.js';

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
}

