import type { Request, Response } from 'express';
import { describe, expect, it, jest } from '@jest/globals';

import { ListRoutesUseCase } from '../../../../src/application/use-cases/list-routes.use-case.js';
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

describe('RoutesController', () => {
  it('returns paginated routes', async () => {
    const repository: RouteRepository = {
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
    const controller = new RoutesController(new ListRoutesUseCase(repository));
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
    const repository: RouteRepository = {
      findAll: async () => {
        throw new Error('Repository should not be called');
      }
    };
    const controller = new RoutesController(new ListRoutesUseCase(repository));
    const request = { query: { page: '0' } } as unknown as Request;
    const response = createResponseMock();

    await controller.list(request, response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({ message: 'Pagina invalida' });
  });

  it('returns 404 when page is out of range', async () => {
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
    const controller = new RoutesController(new ListRoutesUseCase(repository));
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
    const repository: RouteRepository = {
      findAll: async () => {
        throw error;
      }
    };
    const controller = new RoutesController(new ListRoutesUseCase(repository));
    const request = { query: { page: '1' } } as unknown as Request;
    const response = createResponseMock();

    await expect(controller.list(request, response)).rejects.toThrow(error);
  });
});
