export interface RouteTracking {
  routeId: string;
  lastLocation: string;
  latitude?: number;
  longitude?: number;
  progressPercent: number;
  etaMinutes: number;
  timestamp: string;
}
