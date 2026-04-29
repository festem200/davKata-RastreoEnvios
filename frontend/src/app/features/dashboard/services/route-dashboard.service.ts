import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';

import { API_URL } from '../../../core/services/api-url';
import { ListRoutesResponse, Route, RouteStatus } from '../../../core/models/route.model';
import {
  RouteDashboardStats,
  StatusTotal
} from '../models/route-dashboard.models';

const STATUS_VIEW_MODEL: Record<RouteStatus, { label: string; color: string }> = {
  ACTIVA: { label: 'Activas', color: '#174d5f' },
  INACTIVA: { label: 'Inactivas', color: '#7897a1' },
  EN_MANTENIMIENTO: { label: 'Mantenimiento', color: '#d18b39' },
  SUSPENDIDA: { label: 'Suspendidas', color: '#b95345' }
};

@Injectable({ providedIn: 'root' })
export class RouteDashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  getStats(): Observable<RouteDashboardStats> {
    return this.getAllRoutes().pipe(map((routes) => this.buildStats(routes)));
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
        .slice(0, 5)
    };
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
}
