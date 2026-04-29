import { describe, expect, it } from '@jest/globals';

import { FilterRoutesUseCase } from '../../../../src/application/use-cases/filter-routes.use-case.js';
import { RoutePageNotFoundError } from '../../../../src/application/use-cases/list-routes.use-case.js';
import type { RouteRepository } from '../../../../src/domain/ports/route-repository.js';

describe('FilterRoutesUseCase', () => {
  it('filters routes with 20 records per page', async () => {
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
      findByFilters: async (params) => ({
        data: [],
        pagination: {
          page: params.page,
          perPage: params.perPage,
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
      deactivate: async () => null
    };

    const useCase = new FilterRoutesUseCase(repository);
    const routes = await useCase.execute({
      page: 2,
      originCity: 'Bogota',
      status: 'ACTIVA'
    });

    expect(routes.pagination).toEqual({
      page: 2,
      perPage: 20,
      total: 0,
      totalPages: 0
    });
  });

  it('throws when the requested filtered page is out of range', async () => {
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
      findByFilters: async (params) => ({
        data: [],
        pagination: {
          page: params.page,
          perPage: params.perPage,
          total: 100,
          totalPages: 5
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
      deactivate: async () => null
    };

    const useCase = new FilterRoutesUseCase(repository);

    await expect(
      useCase.execute({
        page: 20,
        originCity: 'Bogota'
      })
    ).rejects.toBeInstanceOf(RoutePageNotFoundError);
  });
});
