import { Router } from 'express';

import { TrackShipmentUseCase } from '../../../application/use-cases/track-shipment.use-case.js';
import { InMemoryShipmentRepository } from '../../repositories/in-memory-shipment.repository.js';
import { TrackingController } from '../controllers/tracking.controller.js';

export const createTrackingRouter = (): Router => {
  const router = Router();
  const shipmentRepository = new InMemoryShipmentRepository();
  const trackShipmentUseCase = new TrackShipmentUseCase(shipmentRepository);
  const trackingController = new TrackingController(trackShipmentUseCase);

  router.get('/:trackingNumber', trackingController.findByTrackingNumber);

  return router;
};
