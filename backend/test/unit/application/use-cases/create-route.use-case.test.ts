import { describe, expect, it } from '@jest/globals';

import { CreateRouteUseCase } from '../../../../src/application/use-cases/create-route.use-case.js';
import type { RouteRepository } from '../../../../src/domain/ports/route-repository.js';

describe('CreateRouteUseCase', () => {
  it('creates a route through the repository', async () => {
    const repository: RouteRepository = {
      findAll: async () => ({
        data: [],
        pagination: {
          page: 1,
          perPage: 20,
          total: 0,
          totalPages: 0
        }
      }),
      create: async (params) => ({
        id: '1',
        ...params,
        createdAt: '2024-04-29T10:00:00.000Z'
      }),
      update: async (params) => ({
        ...params,
        createdAt: '2024-04-29T10:00:00.000Z'
      }),
      deactivate: async (id) => ({
        id,
        originCity: 'Bogota',
        destinationCity: 'Medellin',
        distanceKm: 415,
        estimatedTimeHours: 8.5,
        vehicleType: 'CAMION',
        carrier: 'TCC',
        costUsd: 320,
        status: 'INACTIVA',
        createdAt: '2024-04-29T10:00:00.000Z'
      })
    };

    const useCase = new CreateRouteUseCase(repository);
    const route = await useCase.execute({
      originCity: 'Bogota',
      destinationCity: 'Medellin',
      distanceKm: 415,
      estimatedTimeHours: 8.5,
      vehicleType: 'CAMION',
      carrier: 'TCC',
      costUsd: 320,
      status: 'ACTIVA'
    });

    expect(route).toEqual({
      id: '1',
      originCity: 'Bogota',
      destinationCity: 'Medellin',
      distanceKm: 415,
      estimatedTimeHours: 8.5,
      vehicleType: 'CAMION',
      carrier: 'TCC',
      costUsd: 320,
      status: 'ACTIVA',
      createdAt: '2024-04-29T10:00:00.000Z'
    });
  });
});
