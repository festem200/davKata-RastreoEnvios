import type { RouteTracking } from '../../domain/entities/route-tracking.js';
import type { TrackingPort } from '../../domain/ports/tracking-port.js';

interface TrackingCacheEntry {
  expiresAt: number;
  tracking: RouteTracking;
}

export class CachedTrackingAdapter implements TrackingPort {
  private readonly cache = new Map<string, TrackingCacheEntry>();

  constructor(
    private readonly trackingPort: TrackingPort,
    private readonly ttlMs = 60_000,
    private readonly now: () => number = () => Date.now()
  ) {}

  async trackRoute(routeId: string): Promise<RouteTracking> {
    const cachedTracking = this.getCachedTracking(routeId);

    if (cachedTracking) {
      return cachedTracking;
    }

    const tracking = await this.trackingPort.trackRoute(routeId);

    this.cache.set(routeId, {
      expiresAt: this.now() + this.ttlMs,
      tracking: { ...tracking }
    });

    return { ...tracking };
  }

  private getCachedTracking(routeId: string): RouteTracking | null {
    const cachedEntry = this.cache.get(routeId);

    if (!cachedEntry) {
      return null;
    }

    if (cachedEntry.expiresAt <= this.now()) {
      this.cache.delete(routeId);
      return null;
    }

    return { ...cachedEntry.tracking };
  }
}
