import { InvalidCredentialsError } from '../errors/invalid-credentials.error.js';
import type { AccessTokenService } from '../ports/access-token-service.js';
import type { PasswordHasher } from '../ports/password-hasher.js';
import type { UserRole } from '../../domain/constants/user-role.js';
import type { UserRepository } from '../../domain/ports/user-repository.js';

export const ACCESS_TOKEN_EXPIRES_IN = '8h' as const;

export interface LoginCommand {
  email: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  expiresIn: typeof ACCESS_TOKEN_EXPIRES_IN;
  user: {
    id: number;
    role: UserRole;
  };
}

export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly accessTokenService: AccessTokenService
  ) {}

  async execute(command: LoginCommand): Promise<LoginResult> {
    const email = command.email.trim().toLowerCase();
    const user = await this.userRepository.findByEmail(email);

    if (!user || !user.isActive) {
      throw new InvalidCredentialsError();
    }

    const passwordMatches = await this.passwordHasher.compare(command.password, user.passwordHash);

    if (!passwordMatches) {
      throw new InvalidCredentialsError();
    }

    return {
      accessToken: this.accessTokenService.sign({
        sub: user.id,
        email: user.email,
        role: user.role
      }),
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
      user: {
        id: Number(user.id),
        role: user.role
      }
    };
  }
}

