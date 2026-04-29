import { describe, expect, it } from '@jest/globals';

import { TrackRouteUseCase } from '../../../../src/application/use-cases/track-route.use-case.js';
import type { TrackingPort } from '../../../../src/domain/ports/tracking-port.js';

describe('TrackRouteUseCase', () => {
  it('gets route tracking through the tracking port', async () => {
    const trackingPort: TrackingPort = {
      trackRoute: async (routeId) => ({
        routeId,
        lastLocation: 'Bogota',
        progressPercent: 40,
        etaMinutes: 1,
        timestamp: '2026-01-01'
      })
    };
    const useCase = new TrackRouteUseCase(trackingPort);

    const tracking = await useCase.execute('1');

    expect(tracking).toEqual({
      routeId: '1',
      lastLocation: 'Bogota',
      progressPercent: 40,
      etaMinutes: 1,
      timestamp: '2026-01-01'
    });
  });
});
