export interface PasswordHasher {
  compare(plainTextPassword: string, passwordHash: string): Promise<boolean>;
}

