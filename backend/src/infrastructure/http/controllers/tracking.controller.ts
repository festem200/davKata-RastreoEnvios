import type { Request, Response } from 'express';
import { z } from 'zod';

import { TrackShipmentUseCase } from '../../../application/use-cases/track-shipment.use-case.js';

const trackingParamsSchema = z.object({
  trackingNumber: z.string().min(1)
});

export class TrackingController {
  constructor(private readonly trackShipmentUseCase: TrackShipmentUseCase) {}

  findByTrackingNumber = async (request: Request, response: Response): Promise<void> => {
    const parsedParams = trackingParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      response.status(400).json({ message: 'Numero de guia invalido' });
      return;
    }

    const shipment = await this.trackShipmentUseCase.execute(parsedParams.data.trackingNumber);

    if (!shipment) {
      response.status(404).json({ message: 'Envio no encontrado' });
      return;
    }

    response.json(shipment);
  };
}
