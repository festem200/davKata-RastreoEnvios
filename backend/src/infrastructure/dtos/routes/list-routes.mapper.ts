import type { PaginatedRoutes } from '../../../domain/ports/route-repository.js';
import type { ListRoutesResponseDto } from './list-routes-response.dto.js';
import { toRouteResponseDto } from './route.mapper.js';

export const toListRoutesResponseDto = (routes: PaginatedRoutes): ListRoutesResponseDto => ({
  data: routes.data.map(toRouteResponseDto),
  pagination: {
    page: routes.pagination.page,
    perPage: routes.pagination.perPage,
    total: routes.pagination.total,
    totalPages: routes.pagination.totalPages
  }
});
