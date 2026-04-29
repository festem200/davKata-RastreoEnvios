import { PrismaPg } from '@prisma/adapter-pg';

import { env } from '../config/env.js';
import { PrismaClient } from '../../generated/prisma/client.js';

let prismaClient: PrismaClient | null = null;

export const initPrisma = (): PrismaClient => {
  if (!prismaClient) {
    const adapter = new PrismaPg({ connectionString: env.databaseUrl });
    prismaClient = new PrismaClient({ adapter });
  }

  return prismaClient;
};

export const prisma = initPrisma();
