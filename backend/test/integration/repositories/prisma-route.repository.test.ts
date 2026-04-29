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

  it('filters routes and returns pagination metadata', async () => {
    const repository = new PrismaRouteRepository();
    const matchingRoute = await prisma.route.create({
      data: {
        originCity: 'Ciudad Test Origen Filtro',
        destinationCity: 'Ciudad Test Destino Filtro',
        distanceKm: 123.45,
        estimatedTimeHours: 6.5,
        vehicleType: 'CAMION_TEST',
        carrier: TEST_CARRIER,
        costUsd: 456.78,
        status: 'ACTIVA',
        createdAt: TEST_CREATED_AT
      }
    });
    await prisma.route.create({
      data: {
        originCity: 'Ciudad Test Origen Alterna',
        destinationCity: 'Ciudad Test Destino Alterna',
        distanceKm: 234.56,
        estimatedTimeHours: 7.5,
        vehicleType: 'TRACTOMULA_TEST',
        carrier: TEST_CARRIER,
        costUsd: 567.89,
        status: 'INACTIVA',
        createdAt: TEST_CREATED_AT
      }
    });

    const result = await repository.findByFilters({
      page: 1,
      perPage: 20,
      originCity: 'origen filtro',
      destinationCity: 'destino filtro',
      vehicleType: 'camion',
      carrier: TEST_CARRIER,
      status: 'ACTIVA'
    });

    expect(result).toEqual({
      data: [
        {
          id: matchingRoute.id.toString(),
          originCity: 'Ciudad Test Origen Filtro',
          destinationCity: 'Ciudad Test Destino Filtro',
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
        page: 1,
        perPage: 20,
        total: 1,
        totalPages: 1
      }
    });
  });

  it('creates and maps a route', async () => {
    const repository = new PrismaRouteRepository();

    const result = await repository.create({
      originCity: 'Ciudad Test Origen',
      destinationCity: 'Ciudad Test Destino',
      distanceKm: 123.45,
      estimatedTimeHours: 6.5,
      vehicleType: 'CAMION_TEST',
      carrier: TEST_CARRIER,
      costUsd: 456.78,
      status: 'ACTIVA'
    });

    const persistedRoute = await prisma.route.findUniqueOrThrow({
      where: { id: BigInt(result.id) }
    });

    expect(result).toEqual({
      id: persistedRoute.id.toString(),
      originCity: 'Ciudad Test Origen',
      destinationCity: 'Ciudad Test Destino',
      distanceKm: 123.45,
      estimatedTimeHours: 6.5,
      vehicleType: 'CAMION_TEST',
      carrier: TEST_CARRIER,
      costUsd: 456.78,
      status: 'ACTIVA',
      createdAt: persistedRoute.createdAt.toISOString()
    });
  });

  it('imports multiple routes', async () => {
    const repository = new PrismaRouteRepository();

    const result = await repository.importMany([
      {
        originCity: 'Ciudad Test Origen Import 1',
        destinationCity: 'Ciudad Test Destino Import 1',
        distanceKm: 123.45,
        estimatedTimeHours: 6.5,
        vehicleType: 'CAMION_TEST',
        carrier: TEST_CARRIER,
        costUsd: 456.78,
        status: 'ACTIVA',
        createdAt: TEST_CREATED_AT
      },
      {
        originCity: 'Ciudad Test Origen Import 2',
        destinationCity: 'Ciudad Test Destino Import 2',
        distanceKm: 234.56,
        estimatedTimeHours: 7.5,
        vehicleType: 'TRACTOMULA_TEST',
        carrier: TEST_CARRIER,
        costUsd: 567.89,
        status: 'SUSPENDIDA',
        createdAt: TEST_CREATED_AT
      }
    ]);

    const total = await prisma.route.count({
      where: { carrier: TEST_CARRIER }
    });

    expect(result).toBe(2);
    expect(total).toBe(2);
  });

  it('returns zero when importing an empty route list', async () => {
    const repository = new PrismaRouteRepository();

    const result = await repository.importMany([]);

    expect(result).toBe(0);
  });

  it('updates and maps a route', async () => {
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

    const result = await repository.update({
      id: createdRoute.id.toString(),
      originCity: 'Ciudad Test Origen Editada',
      destinationCity: 'Ciudad Test Destino Editada',
      distanceKm: 234.56,
      estimatedTimeHours: 7.5,
      vehicleType: 'TRACTOMULA_TEST',
      carrier: TEST_CARRIER,
      costUsd: 567.89,
      status: 'INACTIVA'
    });

    expect(result).toEqual({
      id: createdRoute.id.toString(),
      originCity: 'Ciudad Test Origen Editada',
      destinationCity: 'Ciudad Test Destino Editada',
      distanceKm: 234.56,
      estimatedTimeHours: 7.5,
      vehicleType: 'TRACTOMULA_TEST',
      carrier: TEST_CARRIER,
      costUsd: 567.89,
      status: 'INACTIVA',
      createdAt: TEST_CREATED_AT.toISOString()
    });
  });

  it('returns null when updating a route that does not exist', async () => {
    const repository = new PrismaRouteRepository();

    const result = await repository.update({
      id: '999999999',
      originCity: 'Ciudad Test Origen',
      destinationCity: 'Ciudad Test Destino',
      distanceKm: 123.45,
      estimatedTimeHours: 6.5,
      vehicleType: 'CAMION_TEST',
      carrier: TEST_CARRIER,
      costUsd: 456.78,
      status: 'ACTIVA'
    });

    expect(result).toBeNull();
  });

  it('deactivates a route by setting status to INACTIVA', async () => {
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

    const result = await repository.deactivate(createdRoute.id.toString());
    const persistedRoute = await prisma.route.findUniqueOrThrow({
      where: { id: createdRoute.id }
    });

    expect(result).toEqual({
      id: createdRoute.id.toString(),
      originCity: 'Ciudad Test Origen',
      destinationCity: 'Ciudad Test Destino',
      distanceKm: 123.45,
      estimatedTimeHours: 6.5,
      vehicleType: 'CAMION_TEST',
      carrier: TEST_CARRIER,
      costUsd: 456.78,
      status: 'INACTIVA',
      createdAt: TEST_CREATED_AT.toISOString()
    });
    expect(persistedRoute.status).toBe('INACTIVA');
  });

  it('returns null when deactivating a route that does not exist', async () => {
    const repository = new PrismaRouteRepository();

    const result = await repository.deactivate('999999999');

    expect(result).toBeNull();
  });
});
