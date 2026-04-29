import { Router } from 'express';
import multer from 'multer';

import { CreateRouteUseCase } from '../../application/use-cases/create-route.use-case.js';
import { DeleteRouteUseCase } from '../../application/use-cases/delete-route.use-case.js';
import { FilterRoutesUseCase } from '../../application/use-cases/filter-routes.use-case.js';
import { ImportRoutesUseCase } from '../../application/use-cases/import-routes.use-case.js';
import { ListRoutesUseCase } from '../../application/use-cases/list-routes.use-case.js';
import { UpdateRouteUseCase } from '../../application/use-cases/update-route.use-case.js';
import { RoutesController } from '../controllers/routes.controller.js';
import { PrismaRouteRepository } from '../repositories/prisma-route.repository.js';

export const createRoutesRouter = (): Router => {
  const router = Router();
  const upload = multer({ storage: multer.memoryStorage() });
  const routeRepository = new PrismaRouteRepository();
  const listRoutesUseCase = new ListRoutesUseCase(routeRepository);
  const createRouteUseCase = new CreateRouteUseCase(routeRepository);
  const updateRouteUseCase = new UpdateRouteUseCase(routeRepository);
  const deleteRouteUseCase = new DeleteRouteUseCase(routeRepository);
  const filterRoutesUseCase = new FilterRoutesUseCase(routeRepository);
  const importRoutesUseCase = new ImportRoutesUseCase(routeRepository);
  const routesController = new RoutesController(
    listRoutesUseCase,
    createRouteUseCase,
    updateRouteUseCase,
    deleteRouteUseCase,
    filterRoutesUseCase,
    importRoutesUseCase
  );

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

  /**
   * GET /api/routes/filter
   *
   * Lists transport routes filtered by optional route fields.
   *
   * Query params:
   * - page: Positive integer page number. Defaults to 1.
   * - origin_city: Optional origin city text.
   * - destination_city: Optional destination city text.
   * - vehicle_type: Optional vehicle type text.
   * - carrier: Optional carrier text.
   * - status: Optional supported route status.
   *
   * Responses:
   * - 200: Paginated filtered route list.
   * - 400: Invalid filters.
   * - 404: Requested page is outside the available pagination range.
   */
  router.get('/filter', routesController.filter);

  /**
   * POST /api/routes
   *
   * Creates a transport route.
   *
   * Body:
   * - originCity: Non-empty string.
   * - destinationCity: Non-empty string.
   * - distanceKm: Positive number.
   * - estimatedTimeHours: Positive number.
   * - vehicleType: Non-empty string.
   * - carrier: Non-empty string.
   * - costUsd: Positive number.
   * - status: Optional non-empty string. Defaults to ACTIVA.
   *
   * Responses:
   * - 201: Created route.
   * - 400: Invalid route body.
   */
  router.post('/', routesController.create);

  /**
   * POST /api/routes/import
   *
   * Imports transport routes from a CSV file in multipart/form-data.
   *
   * Form data:
   * - file: CSV file using the dataset columns.
   *
   * Responses:
   * - 200: Import summary.
   * - 400: Missing or unreadable CSV file.
   */
  router.post('/import', upload.single('file'), routesController.import);

  /**
   * PUT /api/routes/:id
   *
   * Updates a transport route.
   *
   * Params:
   * - id: Positive route identifier.
   *
   * Body:
   * - originCity: Non-empty string.
   * - destinationCity: Non-empty string.
   * - distanceKm: Positive number.
   * - estimatedTimeHours: Positive number.
   * - vehicleType: Non-empty string.
   * - carrier: Non-empty string.
   * - costUsd: Positive number.
   * - status: Supported route status.
   *
   * Responses:
   * - 200: Updated route.
   * - 400: Invalid route id or body.
   * - 404: Route not found.
   */
  router.put('/:id', routesController.update);

  /**
   * DELETE /api/routes/:id
   *
   * Deactivates a transport route by setting its status to INACTIVA.
   *
   * Params:
   * - id: Positive route identifier.
   *
   * Responses:
   * - 200: Deactivated route.
   * - 400: Invalid route id.
   * - 404: Route not found.
   */
  router.delete('/:id', routesController.delete);

  return router;
};
