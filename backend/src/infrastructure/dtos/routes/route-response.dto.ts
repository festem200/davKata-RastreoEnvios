export interface RouteResponseDto {
  id: string;
  originCity: string;
  destinationCity: string;
  distanceKm: number;
  estimatedTimeHours: number;
  vehicleType: string;
  carrier: string;
  costUsd: number;
  status: string;
  createdAt: string;
}
