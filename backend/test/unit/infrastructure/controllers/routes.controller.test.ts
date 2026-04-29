import type { Request, Response } from 'express';
import { describe, expect, it, jest } from '@jest/globals';

import { CreateRouteUseCase } from '../../../../src/application/use-cases/create-route.use-case.js';
import { ListRoutesUseCase } from '../../../../src/application/use-cases/list-routes.use-case.js';
import { UpdateRouteUseCase } from '../../../../src/application/use-cases/update-route.use-case.js';
import type { RouteRepository } from '../../../../src/domain/ports/route-repository.js';
import { RoutesController } from '../../../../src/infrastructure/controllers/routes.controller.js';

const createResponseMock = () => {
  const response = {
    status: jest.fn(),
    json: jest.fn()
  };

  response.status.mockReturnValue(response);
  response.json.mockReturnValue(response);

  return response as unknown as Response;
};

const createRepository = (overrides: Partial<RouteRepository>): RouteRepository => ({
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
  ...overrides
});

const createController = (repositoryOverrides: Partial<RouteRepository>) => {
  const repository = createRepository(repositoryOverrides);

  return new RoutesController(
    new ListRoutesUseCase(repository),
    new CreateRouteUseCase(repository),
    new UpdateRouteUseCase(repository)
  );
};

describe('RoutesController', () => {
  it('returns paginated routes', async () => {
    const repository: Partial<RouteRepository> = {
      create: async (params) => ({
        id: '1',
        ...params,
        createdAt: '2024-04-29T10:00:00.000Z'
      }),
      findAll: async (params) => ({
        data: [
          {
            id: '1',
            originCity: 'Bogota',
            destinationCity: 'Medellin',
            distanceKm: 415,
            estimatedTimeHours: 8.5,
            vehicleType: 'CAMION',
            carrier: 'TCC',
            costUsd: 320,
            status: 'ACTIVA',
            createdAt: '2024-01-05T08:00:00.000Z'
          }
        ],
        pagination: {
          page: params.page,
          perPage: params.perPage,
          total: 1,
          totalPages: 1
        }
      })
    };
    const controller = createController(repository);
    const request = { query: { page: '1' } } as unknown as Request;
    const response = createResponseMock();

    await controller.list(request, response);

    expect(response.status).not.toHaveBeenCalled();
    expect(response.json).toHaveBeenCalledWith({
      data: [
        {
          id: '1',
          originCity: 'Bogota',
          destinationCity: 'Medellin',
          distanceKm: 415,
          estimatedTimeHours: 8.5,
          vehicleType: 'CAMION',
          carrier: 'TCC',
          costUsd: 320,
          status: 'ACTIVA',
          createdAt: '2024-01-05T08:00:00.000Z'
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

  it('returns 400 when page is invalid', async () => {
    const repository: Partial<RouteRepository> = {
      create: async (params) => ({
        id: '1',
        ...params,
        createdAt: '2024-04-29T10:00:00.000Z'
      }),
      findAll: async () => {
        throw new Error('Repository should not be called');
      }
    };
    const controller = createController(repository);
    const request = { query: { page: '0' } } as unknown as Request;
    const response = createResponseMock();

    await controller.list(request, response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({ message: 'Pagina invalida' });
  });

  it('returns 400 when page exceeds the supported range', async () => {
    const repository: Partial<RouteRepository> = {
      create: async (params) => ({
        id: '1',
        ...params,
        createdAt: '2024-04-29T10:00:00.000Z'
      }),
      findAll: async () => {
        throw new Error('Repository should not be called');
      }
    };
    const controller = createController(repository);
    const request = { query: { page: '107374184' } } as unknown as Request;
    const response = createResponseMock();

    await controller.list(request, response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({ message: 'Pagina invalida' });
  });

  it('returns 404 when page is out of range', async () => {
    const repository: Partial<RouteRepository> = {
      create: async (params) => ({
        id: '1',
        ...params,
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
    const controller = createController(repository);
    const request = { query: { page: '20' } } as unknown as Request;
    const response = createResponseMock();

    await controller.list(request, response);

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({
      message: 'Pagina no encontrada',
      pagination: {
        page: 20,
        perPage: 20,
        total: 100,
        totalPages: 5
      }
    });
  });

  it('rethrows unexpected errors', async () => {
    const error = new Error('Database unavailable');
    const repository: Partial<RouteRepository> = {
      create: async (params) => ({
        id: '1',
        ...params,
        createdAt: '2024-04-29T10:00:00.000Z'
      }),
      findAll: async () => {
        throw error;
      }
    };
    const controller = createController(repository);
    const request = { query: { page: '1' } } as unknown as Request;
    const response = createResponseMock();

    await expect(controller.list(request, response)).rejects.toThrow(error);
  });

  it('creates a route', async () => {
    const repository: Partial<RouteRepository> = {
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
      })
    };
    const controller = createController(repository);
    const request = {
      body: {
        originCity: 'Bogota',
        destinationCity: 'Medellin',
        distanceKm: 415,
        estimatedTimeHours: 8.5,
        vehicleType: 'CAMION',
        carrier: 'TCC',
        costUsd: 320
      }
    } as unknown as Request;
    const response = createResponseMock();

    await controller.create(request, response);

    expect(response.status).toHaveBeenCalledWith(201);
    expect(response.json).toHaveBeenCalledWith({
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

  it('returns 400 when route body is invalid', async () => {
    const repository: Partial<RouteRepository> = {
      findAll: async () => ({
        data: [],
        pagination: {
          page: 1,
          perPage: 20,
          total: 0,
          totalPages: 0
        }
      }),
      create: async () => {
        throw new Error('Repository should not be called');
      }
    };
    const controller = createController(repository);
    const request = {
      body: {
        originCity: '',
        destinationCity: 'Medellin',
        distanceKm: 0
      }
    } as unknown as Request;
    const response = createResponseMock();

    await controller.create(request, response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({ message: 'Datos de ruta invalidos' });
  });

  it('returns 400 when route numeric fields exceed database limits', async () => {
    const repository: Partial<RouteRepository> = {
      findAll: async () => ({
        data: [],
        pagination: {
          page: 1,
          perPage: 20,
          total: 0,
          totalPages: 0
        }
      }),
      create: async () => {
        throw new Error('Repository should not be called');
      }
    };
    const controller = createController(repository);
    const request = {
      body: {
        originCity: 'Bogota',
        destinationCity: 'Medellin',
        distanceKm: 100_000_000,
        estimatedTimeHours: 8.5,
        vehicleType: 'CAMION',
        carrier: 'TCC',
        costUsd: 320,
        status: 'ACTIVA'
      }
    } as unknown as Request;
    const response = createResponseMock();

    await controller.create(request, response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({ message: 'Datos de ruta invalidos' });
  });

  it('returns 400 when route status is not supported', async () => {
    const repository: Partial<RouteRepository> = {
      findAll: async () => ({
        data: [],
        pagination: {
          page: 1,
          perPage: 20,
          total: 0,
          totalPages: 0
        }
      }),
      create: async () => {
        throw new Error('Repository should not be called');
      }
    };
    const controller = createController(repository);
    const request = {
      body: {
        originCity: 'Bogota',
        destinationCity: 'Medellin',
        distanceKm: 415,
        estimatedTimeHours: 8.5,
        vehicleType: 'CAMION',
        carrier: 'TCC',
        costUsd: 320,
        status: 'BORRADOR'
      }
    } as unknown as Request;
    const response = createResponseMock();

    await controller.create(request, response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({ message: 'Datos de ruta invalidos' });
  });

  it('rethrows unexpected route creation errors', async () => {
    const error = new Error('Database unavailable');
    const repository: Partial<RouteRepository> = {
      findAll: async () => ({
        data: [],
        pagination: {
          page: 1,
          perPage: 20,
          total: 0,
          totalPages: 0
        }
      }),
      create: async () => {
        throw error;
      }
    };
    const controller = createController(repository);
    const request = {
      body: {
        originCity: 'Bogota',
        destinationCity: 'Medellin',
        distanceKm: 415,
        estimatedTimeHours: 8.5,
        vehicleType: 'CAMION',
        carrier: 'TCC',
        costUsd: 320,
        status: 'ACTIVA'
      }
    } as unknown as Request;
    const response = createResponseMock();

    await expect(controller.create(request, response)).rejects.toThrow(error);
  });

  it('updates a route', async () => {
    const repository: Partial<RouteRepository> = {
      update: async (params) => ({
        ...params,
        createdAt: '2024-04-29T10:00:00.000Z'
      })
    };
    const controller = createController(repository);
    const request = {
      params: { id: '1' },
      body: {
        originCity: 'Bogota',
        destinationCity: 'Cali',
        distanceKm: 460,
        estimatedTimeHours: 9.5,
        vehicleType: 'TRACTOMULA',
        carrier: 'TCC',
        costUsd: 520,
        status: 'INACTIVA'
      }
    } as unknown as Request;
    const response = createResponseMock();

    await controller.update(request, response);

    expect(response.status).not.toHaveBeenCalled();
    expect(response.json).toHaveBeenCalledWith({
      id: '1',
      originCity: 'Bogota',
      destinationCity: 'Cali',
      distanceKm: 460,
      estimatedTimeHours: 9.5,
      vehicleType: 'TRACTOMULA',
      carrier: 'TCC',
      costUsd: 520,
      status: 'INACTIVA',
      createdAt: '2024-04-29T10:00:00.000Z'
    });
  });

  it('returns 400 when route id is invalid', async () => {
    const repository: Partial<RouteRepository> = {
      update: async () => {
        throw new Error('Repository should not be called');
      }
    };
    const controller = createController(repository);
    const request = {
      params: { id: 'abc' },
      body: {
        originCity: 'Bogota',
        destinationCity: 'Cali',
        distanceKm: 460,
        estimatedTimeHours: 9.5,
        vehicleType: 'TRACTOMULA',
        carrier: 'TCC',
        costUsd: 520,
        status: 'INACTIVA'
      }
    } as unknown as Request;
    const response = createResponseMock();

    await controller.update(request, response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({ message: 'Id de ruta invalido' });
  });

  it('returns 400 when update body is invalid', async () => {
    const repository: Partial<RouteRepository> = {
      update: async () => {
        throw new Error('Repository should not be called');
      }
    };
    const controller = createController(repository);
    const request = {
      params: { id: '1' },
      body: {
        originCity: 'Bogota',
        destinationCity: 'Cali',
        distanceKm: 460,
        estimatedTimeHours: 9.5,
        vehicleType: 'TRACTOMULA',
        carrier: 'TCC',
        costUsd: 520,
        status: 'BORRADOR'
      }
    } as unknown as Request;
    const response = createResponseMock();

    await controller.update(request, response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({ message: 'Datos de ruta invalidos' });
  });

  it('returns 404 when route to update does not exist', async () => {
    const repository: Partial<RouteRepository> = {
      update: async () => null
    };
    const controller = createController(repository);
    const request = {
      params: { id: '999' },
      body: {
        originCity: 'Bogota',
        destinationCity: 'Cali',
        distanceKm: 460,
        estimatedTimeHours: 9.5,
        vehicleType: 'TRACTOMULA',
        carrier: 'TCC',
        costUsd: 520,
        status: 'INACTIVA'
      }
    } as unknown as Request;
    const response = createResponseMock();

    await controller.update(request, response);

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({ message: 'Ruta no encontrada' });
  });

  it('rethrows unexpected route update errors', async () => {
    const error = new Error('Database unavailable');
    const repository: Partial<RouteRepository> = {
      update: async () => {
        throw error;
      }
    };
    const controller = createController(repository);
    const request = {
      params: { id: '1' },
      body: {
        originCity: 'Bogota',
        destinationCity: 'Cali',
        distanceKm: 460,
        estimatedTimeHours: 9.5,
        vehicleType: 'TRACTOMULA',
        carrier: 'TCC',
        costUsd: 520,
        status: 'INACTIVA'
      }
    } as unknown as Request;
    const response = createResponseMock();

    await expect(controller.update(request, response)).rejects.toThrow(error);
  });
});
