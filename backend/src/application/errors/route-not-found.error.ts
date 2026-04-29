export class RouteNotFoundError extends Error {
  constructor(readonly routeId: string) {
    super('Ruta no encontrada');
    this.name = 'RouteNotFoundError';
  }
}
