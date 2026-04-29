export type RouteStatus = 'ACTIVA' | 'INACTIVA' | 'EN_MANTENIMIENTO' | 'SUSPENDIDA';

export interface Route {
  id: string;
  originCity: string;
  destinationCity: string;
  distanceKm: number;
  estimatedTimeHours: number;
  vehicleType: string;
  carrier: string;
  costUsd: number;
  status: RouteStatus;
  createdAt: string;
}

export interface RoutePayload {
  originCity: string;
  destinationCity: string;
  distanceKm: number;
  estimatedTimeHours: number;
  vehicleType: string;
  carrier: string;
  costUsd: number;
  status: RouteStatus;
}

export interface RoutePagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface ListRoutesResponse {
  data: Route[];
  pagination: RoutePagination;
}
