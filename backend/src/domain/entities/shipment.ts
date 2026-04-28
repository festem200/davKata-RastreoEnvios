export type ShipmentStatus =
  | 'CREATED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'EXCEPTION';

export interface ShipmentEvent {
  occurredAt: string;
  location: string;
  description: string;
}

export interface Shipment {
  trackingNumber: string;
  recipient: string;
  origin: string;
  destination: string;
  status: ShipmentStatus;
  estimatedDelivery: string;
  events: ShipmentEvent[];
}
