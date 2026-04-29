import type { RouteTracking } from '../../domain/entities/route-tracking.js';
import type { TrackingPort } from '../../domain/ports/tracking-port.js';

export class TrackRouteUseCase {
  constructor(private readonly trackingPort: TrackingPort) {}

  async execute(routeId: string): Promise<RouteTracking> {
    return this.trackingPort.trackRoute(routeId);
  }
}
