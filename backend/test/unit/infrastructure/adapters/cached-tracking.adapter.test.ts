import { describe, expect, it, jest } from '@jest/globals';

import type { RouteTracking } from '../../../../src/domain/entities/route-tracking.js';
import type { TrackingPort } from '../../../../src/domain/ports/tracking-port.js';
import { CachedTrackingAdapter } from '../../../../src/infrastructure/adapters/cached-tracking.adapter.js';

const createTracking = (routeId: string, timestamp: string): RouteTracking => ({
  routeId,
  lastLocation: 'Bogota',
  progressPercent: 40,
  etaMinutes: 1,
  timestamp
});

describe('CachedTrackingAdapter', () => {
  it('returns cached tracking for the same route id before ttl expires', async () => {
    let currentTime = 1_000;
    const trackingPort: TrackingPort = {
      trackRoute: jest.fn<(routeId: string) => Promise<RouteTracking>>(async (routeId) =>
        createTracking(routeId, '2026-01-01T00:00:00.000Z')
      )
    };
    const adapter = new CachedTrackingAdapter(trackingPort, 60_000, () => currentTime);

    const firstTracking = await adapter.trackRoute('1');
    currentTime += 30_000;
    const secondTracking = await adapter.trackRoute('1');

    expect(trackingPort.trackRoute).toHaveBeenCalledTimes(1);
    expect(firstTracking).toEqual(secondTracking);
  });

  it('uses a separate cache entry per route id', async () => {
    let currentTime = 1_000;
    const trackingPort: TrackingPort = {
      trackRoute: jest.fn<(routeId: string) => Promise<RouteTracking>>(async (routeId) =>
        createTracking(routeId, `2026-01-01T00:00:0${routeId}.000Z`)
      )
    };
    const adapter = new CachedTrackingAdapter(trackingPort, 60_000, () => currentTime);

    await adapter.trackRoute('1');
    await adapter.trackRoute('2');
    currentTime += 30_000;
    await adapter.trackRoute('1');
    await adapter.trackRoute('2');

    expect(trackingPort.trackRoute).toHaveBeenCalledTimes(2);
    expect(trackingPort.trackRoute).toHaveBeenNthCalledWith(1, '1');
    expect(trackingPort.trackRoute).toHaveBeenNthCalledWith(2, '2');
  });

  it('refreshes tracking after ttl expires', async () => {
    let currentTime = 1_000;
    const trackingPort: TrackingPort = {
      trackRoute: jest
        .fn<(routeId: string) => Promise<RouteTracking>>()
        .mockResolvedValueOnce(createTracking('1', '2026-01-01T00:00:00.000Z'))
        .mockResolvedValueOnce(createTracking('1', '2026-01-01T00:01:01.000Z'))
    };
    const adapter = new CachedTrackingAdapter(trackingPort, 60_000, () => currentTime);

    const firstTracking = await adapter.trackRoute('1');
    currentTime += 60_000;
    const refreshedTracking = await adapter.trackRoute('1');

    expect(trackingPort.trackRoute).toHaveBeenCalledTimes(2);
    expect(firstTracking.timestamp).toBe('2026-01-01T00:00:00.000Z');
    expect(refreshedTracking.timestamp).toBe('2026-01-01T00:01:01.000Z');
  });

  it('does not cache failed tracking requests', async () => {
    let currentTime = 1_000;
    const trackingPort: TrackingPort = {
      trackRoute: jest
        .fn<(routeId: string) => Promise<RouteTracking>>()
        .mockRejectedValueOnce(new Error('Tracking unavailable'))
        .mockResolvedValueOnce(createTracking('1', '2026-01-01T00:00:00.000Z'))
    };
    const adapter = new CachedTrackingAdapter(trackingPort, 60_000, () => currentTime);

    await expect(adapter.trackRoute('1')).rejects.toThrow('Tracking unavailable');
    currentTime += 1_000;
    const tracking = await adapter.trackRoute('1');

    expect(trackingPort.trackRoute).toHaveBeenCalledTimes(2);
    expect(tracking).toEqual(createTracking('1', '2026-01-01T00:00:00.000Z'));
  });
});
