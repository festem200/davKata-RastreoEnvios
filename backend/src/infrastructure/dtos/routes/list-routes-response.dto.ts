import type { RouteResponseDto } from './route-response.dto.js';

export interface RoutePaginationResponseDto {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface ListRoutesResponseDto {
  data: RouteResponseDto[];
  pagination: RoutePaginationResponseDto;
}
