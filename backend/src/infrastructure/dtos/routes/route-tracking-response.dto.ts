export interface RouteTrackingResponseDto {
  routeId: string;
  lastLocation: string;
  progressPercent: number;
  etaMinutes: number;
  timestamp: string;
}
