import { Router } from 'express';

import { TrackShipmentUseCase } from '../../application/use-cases/track-shipment.use-case.js';
import { PrismaShipmentRepository } from '../repositories/prisma-shipment.repository.js';
import { TrackingController } from '../controllers/tracking.controller.js';

export const createTrackingRouter = (): Router => {
  const router = Router();
  const shipmentRepository = new PrismaShipmentRepository();
  const trackShipmentUseCase = new TrackShipmentUseCase(shipmentRepository);
  const trackingController = new TrackingController(trackShipmentUseCase);

  router.get('/:trackingNumber', trackingController.findByTrackingNumber);

  return router;
};
