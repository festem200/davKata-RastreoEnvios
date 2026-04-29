import type { RouteTracking } from '../entities/route-tracking.js';

export interface TrackingPort {
  trackRoute(routeId: string): Promise<RouteTracking>;
}
