import { describe, expect, it } from '@jest/globals';

import { RouteNotFoundError } from '../../../../src/application/errors/route-not-found.error.js';
import { DeleteRouteUseCase } from '../../../../src/application/use-cases/delete-route.use-case.js';
import type { RouteRepository } from '../../../../src/domain/ports/route-repository.js';

describe('DeleteRouteUseCase', () => {
  it('deactivates a route through the repository', async () => {
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
      findByFilters: async () => ({
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
      importMany: async (params) => params.length,
      update: async (params) => ({
        ...params,
        createdAt: '2024-04-29T10:00:00.000Z'
      }),
      deactivate: async (id) => ({
        id,
        originCity: 'Bogota',
        destinationCity: 'Cali',
        distanceKm: 460,
        estimatedTimeHours: 9.5,
        vehicleType: 'TRACTOMULA',
        carrier: 'TCC',
        costUsd: 520,
        status: 'INACTIVA',
        createdAt: '2024-04-29T10:00:00.000Z'
      })
    };

    const useCase = new DeleteRouteUseCase(repository);
    const route = await useCase.execute('1');

    expect(route.status).toBe('INACTIVA');
    expect(route.id).toBe('1');
  });

  it('throws when the route does not exist', async () => {
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
      findByFilters: async () => ({
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
      importMany: async (params) => params.length,
      update: async (params) => ({
        ...params,
        createdAt: '2024-04-29T10:00:00.000Z'
      }),
      deactivate: async () => null
    };

    const useCase = new DeleteRouteUseCase(repository);

    await expect(useCase.execute('999')).rejects.toBeInstanceOf(RouteNotFoundError);
  });
});
