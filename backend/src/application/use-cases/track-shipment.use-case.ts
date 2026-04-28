import type { Shipment } from '../../domain/entities/shipment.js';
import type { ShipmentRepository } from '../../domain/ports/shipment-repository.js';

export class TrackShipmentUseCase {
  constructor(private readonly shipmentRepository: ShipmentRepository) {}

  async execute(trackingNumber: string): Promise<Shipment | null> {
    const normalizedTrackingNumber = trackingNumber.trim().toUpperCase();

    if (!normalizedTrackingNumber) {
      return null;
    }

    return this.shipmentRepository.findByTrackingNumber(normalizedTrackingNumber);
  }
}
