import { describe, expect, it } from '@jest/globals';

import { ImportRoutesUseCase } from '../../../../src/application/use-cases/import-routes.use-case.js';
import type { RouteRepository } from '../../../../src/domain/ports/route-repository.js';

const createRepository = (imported: number): RouteRepository => ({
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
  importMany: async () => imported,
  update: async (params) => ({
    ...params,
    createdAt: '2024-04-29T10:00:00.000Z'
  }),
  deactivate: async () => null
});

describe('ImportRoutesUseCase', () => {
  it('imports routes through the repository', async () => {
    const useCase = new ImportRoutesUseCase(createRepository(1));

    const imported = await useCase.execute([
      {
        originCity: 'Bogota',
        destinationCity: 'Cali',
        distanceKm: 460,
        estimatedTimeHours: 9.5,
        vehicleType: 'CAMION',
        carrier: 'TCC',
        costUsd: 520,
        status: 'ACTIVA',
        createdAt: new Date('2024-04-29T10:00:00.000Z')
      }
    ]);

    expect(imported).toBe(1);
  });

  it('does not call repository when there are no valid routes', async () => {
    const useCase = new ImportRoutesUseCase(createRepository(99));

    const imported = await useCase.execute([]);

    expect(imported).toBe(0);
  });
});
