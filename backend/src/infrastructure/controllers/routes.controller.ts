import type { Request, Response } from 'express';

import { RouteNotFoundError } from '../../application/errors/route-not-found.error.js';
import { CreateRouteUseCase } from '../../application/use-cases/create-route.use-case.js';
import { DeleteRouteUseCase } from '../../application/use-cases/delete-route.use-case.js';
import { FilterRoutesUseCase } from '../../application/use-cases/filter-routes.use-case.js';
import { ImportRoutesUseCase } from '../../application/use-cases/import-routes.use-case.js';
import {
  ListRoutesUseCase,
  RoutePageNotFoundError
} from '../../application/use-cases/list-routes.use-case.js';
import { UpdateRouteUseCase } from '../../application/use-cases/update-route.use-case.js';
import { createRouteRequestDtoSchema } from '../dtos/routes/create-route-request.dto.js';
import { filterRoutesQueryDtoSchema } from '../dtos/routes/filter-routes-query.dto.js';
import {
  InvalidRoutesCsvError,
  parseRoutesCsv
} from '../dtos/routes/import-routes-csv.dto.js';
import type { ImportRoutesResponseDto } from '../dtos/routes/import-routes-response.dto.js';
import { listRoutesQueryDtoSchema } from '../dtos/routes/list-routes-query.dto.js';
import { toListRoutesResponseDto } from '../dtos/routes/list-routes.mapper.js';
import { routeIdParamDtoSchema } from '../dtos/routes/route-id-param.dto.js';
import { toRouteResponseDto } from '../dtos/routes/route.mapper.js';
import { updateRouteRequestDtoSchema } from '../dtos/routes/update-route-request.dto.js';

export class RoutesController {
  constructor(
    private readonly listRoutesUseCase: ListRoutesUseCase,
    private readonly createRouteUseCase: CreateRouteUseCase,
    private readonly updateRouteUseCase: UpdateRouteUseCase,
    private readonly deleteRouteUseCase: DeleteRouteUseCase,
    private readonly filterRoutesUseCase: FilterRoutesUseCase,
    private readonly importRoutesUseCase: ImportRoutesUseCase
  ) {}

  create = async (request: Request, response: Response): Promise<void> => {
    const parsedBody = createRouteRequestDtoSchema.safeParse(request.body);

    if (!parsedBody.success) {
      response.status(400).json({ message: 'Datos de ruta invalidos' });
      return;
    }

    const route = await this.createRouteUseCase.execute(parsedBody.data);

    response.status(201).json(toRouteResponseDto(route));
  };

  import = async (request: Request, response: Response): Promise<void> => {
    if (!request.file) {
      response.status(400).json({ message: 'Archivo CSV requerido' });
      return;
    }

    try {
      const parsedCsv = parseRoutesCsv(request.file.buffer.toString('utf8'));
      const imported = await this.importRoutesUseCase.execute(parsedCsv.routes);
      const result: ImportRoutesResponseDto = {
        imported,
        failed: parsedCsv.failed,
        errors: parsedCsv.errors
      };

      response.json(result);
    } catch (error) {
      if (error instanceof InvalidRoutesCsvError) {
        response.status(400).json({
          imported: 0,
          failed: 0,
          errors: [{ row: 0, message: `CSV invalido: ${error.message}` }]
        });
        return;
      }

      throw error;
    }
  };

  update = async (request: Request, response: Response): Promise<void> => {
    const parsedParams = routeIdParamDtoSchema.safeParse(request.params);

    if (!parsedParams.success) {
      response.status(400).json({ message: 'Id de ruta invalido' });
      return;
    }

    const parsedBody = updateRouteRequestDtoSchema.safeParse(request.body);

    if (!parsedBody.success) {
      response.status(400).json({ message: 'Datos de ruta invalidos' });
      return;
    }

    try {
      const route = await this.updateRouteUseCase.execute({
        id: parsedParams.data.id,
        ...parsedBody.data
      });

      response.json(toRouteResponseDto(route));
    } catch (error) {
      if (error instanceof RouteNotFoundError) {
        response.status(404).json({ message: error.message });
        return;
      }

      throw error;
    }
  };

  delete = async (request: Request, response: Response): Promise<void> => {
    const parsedParams = routeIdParamDtoSchema.safeParse(request.params);

    if (!parsedParams.success) {
      response.status(400).json({ message: 'Id de ruta invalido' });
      return;
    }

    try {
      const route = await this.deleteRouteUseCase.execute(parsedParams.data.id);

      response.json(toRouteResponseDto(route));
    } catch (error) {
      if (error instanceof RouteNotFoundError) {
        response.status(404).json({ message: error.message });
        return;
      }

      throw error;
    }
  };

  list = async (request: Request, response: Response): Promise<void> => {
    const parsedQuery = listRoutesQueryDtoSchema.safeParse(request.query);

    if (!parsedQuery.success) {
      response.status(400).json({ message: 'Pagina invalida' });
      return;
    }

    try {
      const routes = await this.listRoutesUseCase.execute(parsedQuery.data.page);

      response.json(toListRoutesResponseDto(routes));
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

  filter = async (request: Request, response: Response): Promise<void> => {
    const parsedQuery = filterRoutesQueryDtoSchema.safeParse(request.query);

    if (!parsedQuery.success) {
      response.status(400).json({ message: 'Filtros de ruta invalidos' });
      return;
    }

    try {
      const routes = await this.filterRoutesUseCase.execute(parsedQuery.data);

      response.json(toListRoutesResponseDto(routes));
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
