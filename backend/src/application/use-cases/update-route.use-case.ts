import { RouteNotFoundError } from '../errors/route-not-found.error.js';
import type { Route } from '../../domain/entities/route.js';
import type { RouteRepository, UpdateRouteParams } from '../../domain/ports/route-repository.js';

export class UpdateRouteUseCase {
  constructor(private readonly routeRepository: RouteRepository) {}

  async execute(params: UpdateRouteParams): Promise<Route> {
    const route = await this.routeRepository.update(params);

    if (!route) {
      throw new RouteNotFoundError(params.id);
    }

    return route;
  }
}
