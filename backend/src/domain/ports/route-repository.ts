import type { Route } from '../entities/route.js';

export interface CreateRouteParams {
  originCity: string;
  destinationCity: string;
  distanceKm: number;
  estimatedTimeHours: number;
  vehicleType: string;
  carrier: string;
  costUsd: number;
  status: string;
}

export interface UpdateRouteParams extends CreateRouteParams {
  id: string;
}

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
  create(params: CreateRouteParams): Promise<Route>;
  update(params: UpdateRouteParams): Promise<Route | null>;
  deactivate(id: string): Promise<Route | null>;
}
