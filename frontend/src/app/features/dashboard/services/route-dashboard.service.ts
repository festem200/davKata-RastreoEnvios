import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';

import { API_URL } from '../../../core/services/api-url';
import { ListRoutesResponse, Route, RouteStatus } from '../../../core/models/route.model';
import {
  DashboardDateRange,
  RegionHeatmapItem,
  RouteDashboardStats,
  StatusTotal
} from '../models/route-dashboard.models';

const STATUS_VIEW_MODEL: Record<RouteStatus, { label: string; color: string }> = {
  ACTIVA: { label: 'Activas', color: '#174d5f' },
  INACTIVA: { label: 'Inactivas', color: '#7897a1' },
  EN_MANTENIMIENTO: { label: 'Mantenimiento', color: '#d18b39' },
  SUSPENDIDA: { label: 'Suspendidas', color: '#b95345' }
};

const REGION_VIEW_MODEL = [
  {
    region: 'atlantico',
    label: 'Atlantico',
    cities: [
      'barranquilla',
      'cartagena',
      'santa marta',
      'monteria',
      'sincelejo',
      'riohacha',
      'valledupar'
    ]
  },
  {
    region: 'andina',
    label: 'Andina',
    cities: [
      'bogota',
      'medellin',
      'rionegro',
      'pereira',
      'armenia',
      'manizales',
      'ibague',
      'neiva',
      'tunja',
      'bucaramanga',
      'cucuta',
      'barrancabermeja'
    ]
  },
  {
    region: 'pacifico',
    label: 'Pacifico',
    cities: ['cali', 'pasto', 'popayan', 'buenaventura', 'tumaco', 'quibdo']
  },
  {
    region: 'amazonas',
    label: 'Amazonas',
    cities: ['leticia', 'mocoa', 'florencia', 'san jose del guaviare']
  },
  {
    region: 'orinoquia',
    label: 'Orinoquia',
    cities: ['villavicencio', 'yopal', 'arauca']
  }
] as const;

@Injectable({ providedIn: 'root' })
export class RouteDashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  getStats(dateRange?: DashboardDateRange): Observable<RouteDashboardStats> {
    return this.getAllRoutes().pipe(
      map((routes) => this.filterRoutesByDateRange(routes, dateRange)),
      map((routes) => this.buildStats(routes))
    );
  }

  private getAllRoutes(): Observable<Route[]> {
    return this.getRoutesPage(1).pipe(
      switchMap((firstPage) => {
        const totalPages = firstPage.pagination.totalPages;

        if (totalPages <= 1) {
          return of(firstPage.data);
        }

        const remainingRequests = Array.from({ length: totalPages - 1 }, (_value, index) =>
          this.getRoutesPage(index + 2)
        );

        return forkJoin(remainingRequests).pipe(
          map((remainingPages) => [
            ...firstPage.data,
            ...remainingPages.flatMap((page) => page.data)
          ])
        );
      })
    );
  }

  private getRoutesPage(page: number): Observable<ListRoutesResponse> {
    return this.http.get<ListRoutesResponse>(`${this.apiUrl}/routes`, {
      params: { page }
    });
  }

  private buildStats(routes: Route[]): RouteDashboardStats {
    return {
      totalRoutes: routes.length,
      statusTotals: this.buildStatusTotals(routes),
      topCostRoutes: [...routes]
        .sort((current, next) => next.costUsd - current.costUsd)
        .slice(0, 5),
      activeRoutesByRegion: this.buildActiveRoutesByRegion(routes)
    };
  }

  private filterRoutesByDateRange(routes: Route[], dateRange?: DashboardDateRange): Route[] {
    if (!dateRange?.startDate && !dateRange?.endDate) {
      return routes;
    }

    const startTime = dateRange.startDate
      ? this.getDateAtStartOfDay(dateRange.startDate).getTime()
      : Number.NEGATIVE_INFINITY;
    const endTime = dateRange.endDate
      ? this.getDateAtEndOfDay(dateRange.endDate).getTime()
      : Number.POSITIVE_INFINITY;

    return routes.filter((route) => {
      const createdAtTime = new Date(route.createdAt).getTime();

      return (
        Number.isFinite(createdAtTime) &&
        createdAtTime >= startTime &&
        createdAtTime <= endTime
      );
    });
  }

  private buildStatusTotals(routes: Route[]): StatusTotal[] {
    const counts = routes.reduce<Record<RouteStatus, number>>(
      (accumulator, route) => ({
        ...accumulator,
        [route.status]: accumulator[route.status] + 1
      }),
      {
        ACTIVA: 0,
        INACTIVA: 0,
        EN_MANTENIMIENTO: 0,
        SUSPENDIDA: 0
      }
    );

    return Object.entries(STATUS_VIEW_MODEL).map(([status, viewModel]) => ({
      status: status as RouteStatus,
      label: viewModel.label,
      value: counts[status as RouteStatus],
      color: viewModel.color
    }));
  }

  private buildActiveRoutesByRegion(routes: Route[]): RegionHeatmapItem[] {
    const cityToRegion = new Map<string, (typeof REGION_VIEW_MODEL)[number]>();

    REGION_VIEW_MODEL.forEach((region) => {
      region.cities.forEach((city) => cityToRegion.set(city, region));
    });

    const counts = new Map<string, number>(
      REGION_VIEW_MODEL.map((region) => [region.region, 0])
    );

    routes
      .filter((route) => route.status === 'ACTIVA')
      .forEach((route) => {
        const normalizedCity = this.normalizeCityName(route.originCity);
        const region = cityToRegion.get(normalizedCity) ?? REGION_VIEW_MODEL.at(-1);

        if (!region) {
          return;
        }

        counts.set(region.region, (counts.get(region.region) ?? 0) + 1);
      });

    return REGION_VIEW_MODEL.map((region) => ({
      region: region.region,
      label: region.label,
      activeRoutes: counts.get(region.region) ?? 0
    }));
  }

  private normalizeCityName(city: string): string {
    return city
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  private getDateAtStartOfDay(date: string): Date {
    return new Date(`${date}T00:00:00.000`);
  }

  private getDateAtEndOfDay(date: string): Date {
    return new Date(`${date}T23:59:59.999`);
  }
}
