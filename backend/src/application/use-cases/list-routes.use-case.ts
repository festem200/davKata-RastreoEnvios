import type { PaginatedRoutes, RouteRepository } from '../../domain/ports/route-repository.js';

const ROUTES_PER_PAGE = 20;

export class RoutePageNotFoundError extends Error {
  constructor(readonly pagination: PaginatedRoutes['pagination']) {
    super('Pagina no encontrada');
    this.name = 'RoutePageNotFoundError';
  }
}

export class ListRoutesUseCase {
  constructor(private readonly routeRepository: RouteRepository) {}

  async execute(page: number): Promise<PaginatedRoutes> {
    const routes = await this.routeRepository.findAll({
      page,
      perPage: ROUTES_PER_PAGE
    });

    if (routes.pagination.total > 0 && page > routes.pagination.totalPages) {
      throw new RoutePageNotFoundError(routes.pagination);
    }

    return routes;
  }
}
