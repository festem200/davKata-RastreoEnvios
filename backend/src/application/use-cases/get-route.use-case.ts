import { RouteNotFoundError } from '../errors/route-not-found.error.js';
import type { Route } from '../../domain/entities/route.js';
import type { RouteRepository } from '../../domain/ports/route-repository.js';

export class GetRouteUseCase {
  constructor(private readonly routeRepository: RouteRepository) {}

  async execute(id: string): Promise<Route> {
    const route = await this.routeRepository.findById(id);

    if (!route) {
      throw new RouteNotFoundError(id);
    }

    return route;
  }
}

