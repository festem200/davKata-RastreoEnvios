import bcrypt from 'bcrypt';

import type { PasswordHasher } from '../../application/ports/password-hasher.js';

export class BcryptPasswordHasher implements PasswordHasher {
  compare(plainTextPassword: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(plainTextPassword, passwordHash);
  }
}

