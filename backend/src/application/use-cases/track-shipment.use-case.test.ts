import { describe, expect, it } from 'vitest';

import { ShipmentStatus } from '../../domain/enums/shipment-status.enum.js';
import type { ShipmentRepository } from '../../domain/ports/shipment-repository.js';
import { TrackShipmentUseCase } from './track-shipment.use-case.js';

describe('TrackShipmentUseCase', () => {
  it('normalizes the tracking number before searching', async () => {
    const repository: ShipmentRepository = {
      findByTrackingNumber: async (trackingNumber) => ({
        trackingNumber,
        recipient: 'Cliente Demo',
        origin: 'Bogota',
        destination: 'Medellin',
        status: ShipmentStatus.ACTIVA,
        estimatedDelivery: '2026-05-02'
      })
    };

    const useCase = new TrackShipmentUseCase(repository);
    const shipment = await useCase.execute(' dav123456789 ');

    expect(shipment?.trackingNumber).toBe('DAV123456789');
  });
});
