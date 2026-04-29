import { describe, expect, it } from '@jest/globals';

import type { RouteRepository } from '../../../../src/domain/ports/route-repository.js';
import {
  ListRoutesUseCase,
  RoutePageNotFoundError
} from '../../../../src/application/use-cases/list-routes.use-case.js';

describe('ListRoutesUseCase', () => {
  it('lists routes with 20 records per page', async () => {
    const repository: RouteRepository = {
      create: async (params) => ({
        id: '1',
        ...params,
        createdAt: '2024-04-29T10:00:00.000Z'
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
      }),
      findAll: async (params) => ({
        data: [],
        pagination: {
          page: params.page,
          perPage: params.perPage,
          total: 0,
          totalPages: 0
        }
      })
    };

    const useCase = new ListRoutesUseCase(repository);
    const routes = await useCase.execute(2);

    expect(routes.pagination).toEqual({
      page: 2,
      perPage: 20,
      total: 0,
      totalPages: 0
    });
  });

  it('throws when the requested page is out of range', async () => {
    const repository: RouteRepository = {
      create: async (params) => ({
        id: '1',
        ...params,
        createdAt: '2024-04-29T10:00:00.000Z'
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
      }),
      findAll: async (params) => ({
        data: [],
        pagination: {
          page: params.page,
          perPage: params.perPage,
          total: 100,
          totalPages: 5
        }
      })
    };

    const useCase = new ListRoutesUseCase(repository);

    await expect(useCase.execute(20)).rejects.toBeInstanceOf(RoutePageNotFoundError);
  });
});
