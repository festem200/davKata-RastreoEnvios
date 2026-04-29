import type { CreateRouteParams, RouteRepository } from '../../domain/ports/route-repository.js';
import type { Route } from '../../domain/entities/route.js';

export class CreateRouteUseCase {
  constructor(private readonly routeRepository: RouteRepository) {}

  async execute(params: CreateRouteParams): Promise<Route> {
    return this.routeRepository.create(params);
  }
}
