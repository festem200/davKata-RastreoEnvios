import { describe, expect, it } from '@jest/globals';

import type { RouteRepository } from '../../../../src/domain/ports/route-repository.js';
import {
  ListRoutesUseCase,
  RoutePageNotFoundError
} from '../../../../src/application/use-cases/list-routes.use-case.js';

describe('ListRoutesUseCase', () => {
  it('lists routes with 20 records per page', async () => {
    const repository: RouteRepository = {
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
