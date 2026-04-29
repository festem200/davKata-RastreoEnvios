import { ShipmentStatus } from '../enums/shipment-status.enum.js';

export interface Shipment {
  trackingNumber: string;
  recipient: string;
  origin: string;
  destination: string;
  status: ShipmentStatus;
  estimatedDelivery: string;
}
