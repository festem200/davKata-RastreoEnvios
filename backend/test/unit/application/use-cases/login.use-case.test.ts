import { describe, expect, it, jest } from '@jest/globals';

import { InvalidCredentialsError } from '../../../../src/application/errors/invalid-credentials.error.js';
import { LoginUseCase } from '../../../../src/application/use-cases/login.use-case.js';
import type { AccessTokenService } from '../../../../src/application/ports/access-token-service.js';
import type { PasswordHasher } from '../../../../src/application/ports/password-hasher.js';
import type { User } from '../../../../src/domain/entities/user.js';
import type { UserRepository } from '../../../../src/domain/ports/user-repository.js';

const createUser = (overrides: Partial<User> = {}): User => ({
  id: '1',
  email: 'admin@test.com',
  passwordHash: '$2b$12$hashed-password',
  role: 'ADMIN',
  isActive: true,
  ...overrides
});

const createUseCase = ({
  user = createUser(),
  passwordMatches = true
}: {
  user?: User | null;
  passwordMatches?: boolean;
}) => {
  const userRepository: UserRepository = {
    findByEmail: jest.fn(async () => user)
  };
  const passwordHasher: PasswordHasher = {
    compare: jest.fn(async () => passwordMatches)
  };
  const accessTokenService: AccessTokenService = {
    sign: jest.fn(() => 'signed-token')
  };

  return {
    useCase: new LoginUseCase(userRepository, passwordHasher, accessTokenService),
    userRepository,
    passwordHasher,
    accessTokenService
  };
};

describe('LoginUseCase', () => {
  it('returns an access token for valid credentials', async () => {
    const { useCase, userRepository, passwordHasher, accessTokenService } = createUseCase({});

    const result = await useCase.execute({
      email: 'ADMIN@Test.com ',
      password: '123456'
    });

    expect(userRepository.findByEmail).toHaveBeenCalledWith('admin@test.com');
    expect(passwordHasher.compare).toHaveBeenCalledWith('123456', '$2b$12$hashed-password');
    expect(accessTokenService.sign).toHaveBeenCalledWith({
      sub: '1',
      email: 'admin@test.com',
      role: 'ADMIN'
    });
    expect(result).toEqual({
      accessToken: 'signed-token',
      expiresIn: '8h',
      user: {
        id: 1,
        role: 'ADMIN'
      }
    });
  });

  it('rejects unknown users', async () => {
    const { useCase } = createUseCase({ user: null });

    await expect(
      useCase.execute({
        email: 'admin@test.com',
        password: '123456'
      })
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('rejects inactive users', async () => {
    const { useCase } = createUseCase({ user: createUser({ isActive: false }) });

    await expect(
      useCase.execute({
        email: 'admin@test.com',
        password: '123456'
      })
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('rejects invalid passwords', async () => {
    const { useCase } = createUseCase({ passwordMatches: false });

    await expect(
      useCase.execute({
        email: 'admin@test.com',
        password: 'wrong-password'
      })
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });
});

