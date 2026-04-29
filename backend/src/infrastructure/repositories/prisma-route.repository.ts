import type { Route } from '../../domain/entities/route.js';
import type {
  CreateRouteParams,
  PaginatedRoutes,
  RouteFilterParams,
  RoutePaginationParams,
  RouteRepository,
  UpdateRouteParams
} from '../../domain/ports/route-repository.js';
import { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../database/prisma.js';

export class PrismaRouteRepository implements RouteRepository {
  async create(params: CreateRouteParams): Promise<Route> {
    const route = await prisma.route.create({
      data: params
    });

    return this.toDomain(route);
  }

  async update({ id, ...params }: UpdateRouteParams): Promise<Route | null> {
    try {
      const route = await prisma.route.update({
        where: { id: BigInt(id) },
        data: params
      });

      return this.toDomain(route);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return null;
      }

      throw error;
    }
  }

  async deactivate(id: string): Promise<Route | null> {
    try {
      const route = await prisma.route.update({
        where: { id: BigInt(id) },
        data: { status: 'INACTIVA' }
      });

      return this.toDomain(route);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return null;
      }

      throw error;
    }
  }

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
      data: routes.map((route) => this.toDomain(route)),
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage)
      }
    };
  }

  async findByFilters({
    page,
    perPage,
    originCity,
    destinationCity,
    vehicleType,
    carrier,
    status
  }: RouteFilterParams): Promise<PaginatedRoutes> {
    const skip = (page - 1) * perPage;
    const where: Prisma.RouteWhereInput = {
      ...(originCity ? { originCity: { contains: originCity, mode: 'insensitive' } } : {}),
      ...(destinationCity
        ? { destinationCity: { contains: destinationCity, mode: 'insensitive' } }
        : {}),
      ...(vehicleType ? { vehicleType: { contains: vehicleType, mode: 'insensitive' } } : {}),
      ...(carrier ? { carrier: { contains: carrier, mode: 'insensitive' } } : {}),
      ...(status ? { status } : {})
    };
    const [routes, total] = await prisma.$transaction([
      prisma.route.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { id: 'asc' }
      }),
      prisma.route.count({ where })
    ]);

    return {
      data: routes.map((route) => this.toDomain(route)),
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage)
      }
    };
  }

  private toDomain(route: {
    id: bigint;
    originCity: string;
    destinationCity: string;
    distanceKm: unknown;
    estimatedTimeHours: unknown;
    vehicleType: string;
    carrier: string;
    costUsd: unknown;
    status: string;
    createdAt: Date;
  }): Route {
    return {
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
    };
  }
}
