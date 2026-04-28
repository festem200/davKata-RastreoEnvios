import type { Shipment } from '../../domain/entities/shipment.js';
import type { ShipmentRepository } from '../../domain/ports/shipment-repository.js';

const shipments: Shipment[] = [
  {
    trackingNumber: 'DAV123456789',
    recipient: 'Cliente Demo',
    origin: 'Bogota, Colombia',
    destination: 'Medellin, Colombia',
    status: 'IN_TRANSIT',
    estimatedDelivery: '2026-05-02',
    events: [
      {
        occurredAt: '2026-04-27T09:30:00-05:00',
        location: 'Bogota',
        description: 'Envio recibido en centro logistico'
      },
      {
        occurredAt: '2026-04-28T07:15:00-05:00',
        location: 'Villeta',
        description: 'Envio en ruta hacia destino'
      }
    ]
  }
];

export class InMemoryShipmentRepository implements ShipmentRepository {
  async findByTrackingNumber(trackingNumber: string): Promise<Shipment | null> {
    return shipments.find((shipment) => shipment.trackingNumber === trackingNumber) ?? null;
  }
}
