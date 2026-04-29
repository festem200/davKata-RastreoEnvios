import { Router } from 'express';

import { ListRoutesUseCase } from '../../application/use-cases/list-routes.use-case.js';
import { RoutesController } from '../controllers/routes.controller.js';
import { PrismaRouteRepository } from '../repositories/prisma-route.repository.js';

export const createRoutesRouter = (): Router => {
  const router = Router();
  const routeRepository = new PrismaRouteRepository();
  const listRoutesUseCase = new ListRoutesUseCase(routeRepository);
  const routesController = new RoutesController(listRoutesUseCase);

  /**
   * GET /api/routes
   *
   * Lists transport routes with fixed pagination of 20 records per page.
   *
   * Query params:
   * - page: Positive integer page number. Defaults to 1.
   *
   * Responses:
   * - 200: Paginated route list.
   * - 400: Invalid page query parameter.
   * - 404: Requested page is outside the available pagination range.
   */
  router.get('/', routesController.list);

  return router;
};
