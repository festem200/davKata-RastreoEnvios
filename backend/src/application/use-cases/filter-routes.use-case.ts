import type { PaginatedRoutes, RouteFilterParams, RouteRepository } from '../../domain/ports/route-repository.js';
import { RoutePageNotFoundError } from './list-routes.use-case.js';

const ROUTES_PER_PAGE = 20;

export class FilterRoutesUseCase {
  constructor(private readonly routeRepository: RouteRepository) {}

  async execute(params: Omit<RouteFilterParams, 'perPage'>): Promise<PaginatedRoutes> {
    const routes = await this.routeRepository.findByFilters({
      ...params,
      perPage: ROUTES_PER_PAGE
    });

    if (routes.pagination.total > 0 && params.page > routes.pagination.totalPages) {
      throw new RoutePageNotFoundError(routes.pagination);
    }

    return routes;
  }
}
