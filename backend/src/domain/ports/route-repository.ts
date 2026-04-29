import type { Route } from '../entities/route.js';

export interface RoutePaginationParams {
  page: number;
  perPage: number;
}

export interface PaginatedRoutes {
  data: Route[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface RouteRepository {
  findAll(params: RoutePaginationParams): Promise<PaginatedRoutes>;
}

