import type { Shipment } from '../entities/shipment.js';

export interface ShipmentRepository {
  findByTrackingNumber(trackingNumber: string): Promise<Shipment | null>;
}
