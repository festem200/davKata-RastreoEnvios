import type { Request, Response } from 'express';
import { z } from 'zod';

import {
  ListRoutesUseCase,
  RoutePageNotFoundError
} from '../../application/use-cases/list-routes.use-case.js';

const listRoutesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1)
});

export class RoutesController {
  constructor(private readonly listRoutesUseCase: ListRoutesUseCase) {}

  list = async (request: Request, response: Response): Promise<void> => {
    const parsedQuery = listRoutesQuerySchema.safeParse(request.query);

    if (!parsedQuery.success) {
      response.status(400).json({ message: 'Pagina invalida' });
      return;
    }

    try {
      const routes = await this.listRoutesUseCase.execute(parsedQuery.data.page);

      response.json(routes);
    } catch (error) {
      if (error instanceof RoutePageNotFoundError) {
        response.status(404).json({
          message: error.message,
          pagination: error.pagination
        });
        return;
      }

      throw error;
    }
  };
}
