import type { Route } from '../../../domain/entities/route.js';
import type { RouteResponseDto } from './route-response.dto.js';

export const toRouteResponseDto = (route: Route): RouteResponseDto => ({
  id: route.id,
  originCity: route.originCity,
  destinationCity: route.destinationCity,
  distanceKm: route.distanceKm,
  estimatedTimeHours: route.estimatedTimeHours,
  vehicleType: route.vehicleType,
  carrier: route.carrier,
  costUsd: route.costUsd,
  status: route.status,
  createdAt: route.createdAt
});
