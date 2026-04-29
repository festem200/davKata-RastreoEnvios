import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  finalize,
  from,
  map,
  mergeMap,
  Observable,
  of,
  switchMap,
  timer,
  toArray
} from 'rxjs';

import { Route } from '../../../../core/models/route.model';
import { AppShellComponent } from '../../../../shared/components/app-shell/app-shell.component';
import { RouteTracking } from '../../models/route-tracking.model';
import { RoutesService } from '../../services/routes.service';
import { TrackingService as RouteTrackingService } from '../../services/tracking.service';

interface RouteTrackingRow {
  route: Route;
  tracking: RouteTracking | null;
  errorMessage: string | null;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

const REFRESH_INTERVAL_MS = 30000;
const TRACKING_REQUEST_CONCURRENCY = 4;
const ACTIVE_ROUTE_STATUSES = ['ACTIVA', 'ACTIVE', 'EN_TRANSITO'];

@Component({
  selector: 'app-route-monitoring-page',
  imports: [CommonModule, AppShellComponent],
  templateUrl: './route-monitoring-page.component.html',
  styleUrl: './route-monitoring-page.component.scss'
})
export class RouteMonitoringPageComponent {
  private readonly routesService = inject(RoutesService);
  private readonly trackingService = inject(RouteTrackingService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly rows = signal<RouteTrackingRow[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly isRefreshing = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly lastRefreshAt = signal<Date | null>(null);
  protected readonly activeRoutesCount = computed(() => this.rows().length);

  constructor() {
    this.startAutoRefresh();
  }

  protected retry(): void {
    this.refreshTracking();
  }

  protected formatCoordinates(tracking: RouteTracking): string {
    const coordinates = this.getCoordinates(tracking);

    if (coordinates) {
      return `lat: ${coordinates.latitude.toFixed(4)}, lng: ${coordinates.longitude.toFixed(4)}`;
    }

    return tracking.lastLocation || 'Sin coordenadas';
  }

  protected formatEta(etaMinutes: number): string {
    return `${etaMinutes} min`;
  }

  protected normalizeProgress(value: number): number {
    return Math.min(Math.max(value, 0), 100);
  }

  private startAutoRefresh(): void {
    timer(0, REFRESH_INTERVAL_MS)
      .pipe(
        switchMap(() => {
          this.isRefreshing.set(true);

          return this.getActiveRoutesTracking().pipe(
            map((rows) => ({ rows, errorMessage: null })),
            catchError(() =>
              of({
                rows: [],
                errorMessage: 'No fue posible cargar las rutas activas.'
              })
            )
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((result) => {
        this.rows.set(result.rows);
        this.errorMessage.set(result.errorMessage);
        this.isLoading.set(false);
        this.isRefreshing.set(false);
        this.lastRefreshAt.set(new Date());
      });
  }

  private refreshTracking(): void {
    this.isLoading.set(this.rows().length === 0);
    this.isRefreshing.set(true);

    this.getActiveRoutesTracking()
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
          this.isRefreshing.set(false);
          this.lastRefreshAt.set(new Date());
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (rows) => {
          this.rows.set(rows);
          this.errorMessage.set(null);
        },
        error: () => {
          this.rows.set([]);
          this.errorMessage.set('No fue posible cargar las rutas activas.');
        }
      });
  }

  private getActiveRoutesTracking(): Observable<RouteTrackingRow[]> {
    return this.routesService.listAll().pipe(
      map((routes) => routes.filter((route) => this.isActiveRoute(route))),
      switchMap((activeRoutes) => {
        if (activeRoutes.length === 0) {
          return of([]);
        }

        return from(activeRoutes).pipe(
          mergeMap(
            (route) =>
              this.trackingService.getRouteTracking(route.id).pipe(
              map((tracking) => ({
                route,
                tracking,
                errorMessage: null
              })),
              catchError(() =>
                of({
                  route,
                  tracking: null,
                  errorMessage: 'Tracking no disponible'
                })
              )
              ),
            TRACKING_REQUEST_CONCURRENCY
          ),
          toArray()
        );
      })
    );
  }

  private isActiveRoute(route: Route): boolean {
    return ACTIVE_ROUTE_STATUSES.includes(route.status);
  }

  private getCoordinates(tracking: RouteTracking): Coordinates | null {
    if (Number.isFinite(tracking.latitude) && Number.isFinite(tracking.longitude)) {
      return {
        latitude: Number(tracking.latitude),
        longitude: Number(tracking.longitude)
      };
    }

    const matches = tracking.lastLocation.match(/-?\d+(?:[.,]\d+)?/g);

    if (!matches || matches.length < 2) {
      return null;
    }

    const latitude = this.parseCoordinate(matches[0]);
    const longitude = this.parseCoordinate(matches[1]);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    return { latitude, longitude };
  }

  private parseCoordinate(value: string): number {
    return Number(value.replace(',', '.'));
  }
}
