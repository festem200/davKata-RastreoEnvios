import type { Route } from '../../domain/entities/route.js';
import type {
  PaginatedRoutes,
  RoutePaginationParams,
  RouteRepository
} from '../../domain/ports/route-repository.js';
import { prisma } from '../database/prisma.js';

export class PrismaRouteRepository implements RouteRepository {
  async findAll({ page, perPage }: RoutePaginationParams): Promise<PaginatedRoutes> {
    const skip = (page - 1) * perPage;
    const [routes, total] = await prisma.$transaction([
      prisma.route.findMany({
        skip,
        take: perPage,
        orderBy: { id: 'asc' }
      }),
      prisma.route.count()
    ]);

    return {
      data: routes.map<Route>((route) => ({
        id: route.id.toString(),
        originCity: route.originCity,
        destinationCity: route.destinationCity,
        distanceKm: Number(route.distanceKm),
        estimatedTimeHours: Number(route.estimatedTimeHours),
        vehicleType: route.vehicleType,
        carrier: route.carrier,
        costUsd: Number(route.costUsd),
        status: route.status,
        createdAt: route.createdAt.toISOString()
      })),
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage)
      }
    };
  }
}

