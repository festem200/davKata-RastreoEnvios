import { ShipmentStatus } from '../../domain/enums/shipment-status.enum.js';
import type { Shipment } from '../../domain/entities/shipment.js';
import type { ShipmentRepository } from '../../domain/ports/shipment-repository.js';
import { prisma } from '../database/prisma.js';

export class PrismaShipmentRepository implements ShipmentRepository {
  async findByTrackingNumber(trackingNumber: string): Promise<Shipment | null> {
    const shipment = await prisma.shipment.findUnique({
      where: { trackingNumber }
    });

    if (!shipment) {
      return null;
    }

    return {
      trackingNumber: shipment.trackingNumber,
      recipient: shipment.recipient,
      origin: shipment.origin,
      destination: shipment.destination,
      status: shipment.status as ShipmentStatus,
      estimatedDelivery: shipment.estimatedDelivery.toISOString().slice(0, 10)
    };
  }
}
