import { USER_ROLES, type UserRole } from '../../domain/constants/user-role.js';
import type { User } from '../../domain/entities/user.js';
import type { UserRepository } from '../../domain/ports/user-repository.js';
import { prisma } from '../database/prisma.js';

const isUserRole = (role: string): role is UserRole =>
  USER_ROLES.includes(role as UserRole);

export class PrismaUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !isUserRole(user.role)) {
      return null;
    }

    return {
      id: user.id.toString(),
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role,
      isActive: user.isActive
    };
  }
}

