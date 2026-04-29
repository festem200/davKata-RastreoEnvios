import type { ImportRouteParams, RouteRepository } from '../../domain/ports/route-repository.js';

export class ImportRoutesUseCase {
  constructor(private readonly routeRepository: RouteRepository) {}

  async execute(routes: ImportRouteParams[]): Promise<number> {
    if (routes.length === 0) {
      return 0;
    }

    return this.routeRepository.importMany(routes);
  }
}
