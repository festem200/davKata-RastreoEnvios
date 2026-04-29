import { afterAll, afterEach, beforeEach, describe, expect, it } from '@jest/globals';

import '../../setup/integration-env.js';
import { PrismaRouteRepository } from '../../../src/infrastructure/repositories/prisma-route.repository.js';
import { prisma } from '../../../src/infrastructure/database/prisma.js';

const TEST_CARRIER = 'JEST_ROUTE_CARRIER';
const TEST_CREATED_AT = new Date('2024-04-29T10:00:00.000Z');

const cleanupRoutes = async () => {
  await prisma.route.deleteMany({
    where: { carrier: TEST_CARRIER }
  });
};

describe('PrismaRouteRepository integration', () => {
  beforeEach(async () => {
    await cleanupRoutes();
  });

  afterEach(async () => {
    await cleanupRoutes();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('maps the last persisted route and returns pagination metadata', async () => {
    const repository = new PrismaRouteRepository();

    const createdRoute = await prisma.route.create({
      data: {
        originCity: 'Ciudad Test Origen',
        destinationCity: 'Ciudad Test Destino',
        distanceKm: 123.45,
        estimatedTimeHours: 6.5,
        vehicleType: 'CAMION_TEST',
        carrier: TEST_CARRIER,
        costUsd: 456.78,
        status: 'ACTIVA',
        createdAt: TEST_CREATED_AT
      }
    });
    const total = await prisma.route.count();

    const result = await repository.findAll({
      page: total,
      perPage: 1
    });

    expect(result).toEqual({
      data: [
        {
          id: createdRoute.id.toString(),
          originCity: 'Ciudad Test Origen',
          destinationCity: 'Ciudad Test Destino',
          distanceKm: 123.45,
          estimatedTimeHours: 6.5,
          vehicleType: 'CAMION_TEST',
          carrier: TEST_CARRIER,
          costUsd: 456.78,
          status: 'ACTIVA',
          createdAt: TEST_CREATED_AT.toISOString()
        }
      ],
      pagination: {
        page: total,
        perPage: 1,
        total,
        totalPages: total
      }
    });
  });
});
