import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
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
  toArray,
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

interface MonitoringFilterForm {
  search: FormControl<string>;
  vehicleType: FormControl<string>;
  carrier: FormControl<string>;
  trackingStatus: FormControl<TrackingStatusFilter>;
}

interface MonitoringFilters {
  search: string;
  vehicleType: string;
  carrier: string;
  trackingStatus: TrackingStatusFilter;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

type TrackingStatusFilter = 'TODOS' | 'DISPONIBLE' | 'NO_DISPONIBLE';
type SortKey =
  | 'route'
  | 'vehicleType'
  | 'carrier'
  | 'progress'
  | 'eta'
  | 'timestamp'
  | 'trackingStatus';
type SortDirection = 'asc' | 'desc';

const REFRESH_INTERVAL_MS = 30000;
const TRACKING_REQUEST_CONCURRENCY = 4;
const ACTIVE_ROUTE_STATUSES = ['ACTIVA', 'ACTIVE', 'EN_TRANSITO'];

@Component({
  selector: 'app-route-monitoring-page',
  imports: [CommonModule, ReactiveFormsModule, AppShellComponent],
  templateUrl: './route-monitoring-page.component.html',
  styleUrl: './route-monitoring-page.component.scss',
})
export class RouteMonitoringPageComponent {
  private readonly routesService = inject(RoutesService);
  private readonly trackingService = inject(RouteTrackingService);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly pageSizeOptions = [10, 20, 50];
  protected readonly rows = signal<RouteTrackingRow[]>([]);
  protected readonly filters = signal<MonitoringFilters>({
    search: '',
    vehicleType: 'TODOS',
    carrier: 'TODOS',
    trackingStatus: 'TODOS',
  });
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly sortKey = signal<SortKey>('route');
  protected readonly sortDirection = signal<SortDirection>('asc');
  protected readonly isLoading = signal(true);
  protected readonly isRefreshing = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly lastRefreshAt = signal<Date | null>(null);
  protected readonly activeRoutesCount = computed(() => this.rows().length);
  protected readonly filterForm = this.formBuilder.group<MonitoringFilterForm>({
    search: this.formBuilder.control(''),
    vehicleType: this.formBuilder.control('TODOS'),
    carrier: this.formBuilder.control('TODOS'),
    trackingStatus: this.formBuilder.control<TrackingStatusFilter>('TODOS'),
  });
  protected readonly filteredRows = computed(() => {
    const filters = this.filters();
    const search = this.normalizeText(filters.search);

    return this.rows().filter((row) => {
      const tracking = row.tracking;
      const coordinates = tracking ? this.formatCoordinates(tracking) : '';
      const searchableText = this.normalizeText(
        `${row.route.originCity} ${row.route.destinationCity} ${row.route.carrier} ${row.route.vehicleType} ${coordinates}`,
      );
      const matchesSearch = !search || searchableText.includes(search);
      const matchesVehicleType =
        filters.vehicleType === 'TODOS' || row.route.vehicleType === filters.vehicleType;
      const matchesCarrier = filters.carrier === 'TODOS' || row.route.carrier === filters.carrier;
      const matchesTrackingStatus =
        filters.trackingStatus === 'TODOS' ||
        this.getTrackingStatus(row) === filters.trackingStatus;

      return matchesSearch && matchesVehicleType && matchesCarrier && matchesTrackingStatus;
    });
  });
  protected readonly sortedRows = computed(() => {
    const key = this.sortKey();
    const direction = this.sortDirection();

    return [...this.filteredRows()].sort((current, next) => {
      const result = this.compareRows(current, next, key);
      return direction === 'asc' ? result : -result;
    });
  });
  protected readonly paginatedRows = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.sortedRows().slice(start, start + this.pageSize());
  });
  protected readonly pagination = computed(() => {
    const total = this.filteredRows().length;
    const perPage = this.pageSize();
    const totalPages = Math.max(1, Math.ceil(total / perPage));

    return {
      page: Math.min(this.currentPage(), totalPages),
      perPage,
      total,
      totalPages,
    };
  });
  protected readonly vehicleTypes = computed(() =>
    this.uniqueSorted(this.rows().map((row) => row.route.vehicleType)),
  );
  protected readonly carriers = computed(() =>
    this.uniqueSorted(this.rows().map((row) => row.route.carrier)),
  );

  constructor() {
    this.filterForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.filters.set(this.filterForm.getRawValue());
      this.currentPage.set(1);
    });
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

  protected goToPreviousPage(): void {
    const page = this.currentPage();

    if (page > 1) {
      this.currentPage.set(page - 1);
    }
  }

  protected goToNextPage(): void {
    const pagination = this.pagination();

    if (pagination.page < pagination.totalPages) {
      this.currentPage.set(pagination.page + 1);
    }
  }

  protected setPageSize(value: string): void {
    this.pageSize.set(Number(value));
    this.currentPage.set(1);
  }

  protected sortBy(key: SortKey): void {
    if (this.sortKey() === key) {
      this.sortDirection.update((direction) => (direction === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortKey.set(key);
      this.sortDirection.set('asc');
    }

    this.currentPage.set(1);
  }

  protected sortLabel(key: SortKey): string {
    if (this.sortKey() !== key) {
      return '';
    }

    return this.sortDirection() === 'asc' ? 'ASC' : 'DESC';
  }

  protected resetFilters(): void {
    const filters: MonitoringFilters = {
      search: '',
      vehicleType: 'TODOS',
      carrier: 'TODOS',
      trackingStatus: 'TODOS',
    };

    this.filterForm.reset(filters);
    this.filters.set(filters);
    this.currentPage.set(1);
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
                errorMessage: 'No fue posible cargar las rutas activas.',
              }),
            ),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        this.rows.set(result.rows);
        this.errorMessage.set(result.errorMessage);
        this.clampCurrentPage();
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
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (rows) => {
          this.rows.set(rows);
          this.errorMessage.set(null);
          this.clampCurrentPage();
        },
        error: () => {
          this.rows.set([]);
          this.errorMessage.set('No fue posible cargar las rutas activas.');
        },
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
                  errorMessage: null,
                })),
                catchError(() =>
                  of({
                    route,
                    tracking: null,
                  errorMessage: 'Seguimiento no disponible',
                  }),
                ),
              ),
            TRACKING_REQUEST_CONCURRENCY,
          ),
          toArray(),
        );
      }),
    );
  }

  private isActiveRoute(route: Route): boolean {
    return ACTIVE_ROUTE_STATUSES.includes(route.status);
  }

  private getCoordinates(tracking: RouteTracking): Coordinates | null {
    if (Number.isFinite(tracking.latitude) && Number.isFinite(tracking.longitude)) {
      return {
        latitude: Number(tracking.latitude),
        longitude: Number(tracking.longitude),
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

  private getTrackingStatus(row: RouteTrackingRow): TrackingStatusFilter {
    return row.tracking ? 'DISPONIBLE' : 'NO_DISPONIBLE';
  }

  private clampCurrentPage(): void {
    const totalPages = this.pagination().totalPages;

    if (this.currentPage() > totalPages) {
      this.currentPage.set(totalPages);
    }
  }

  private compareRows(current: RouteTrackingRow, next: RouteTrackingRow, key: SortKey): number {
    if (key === 'route') {
      return this.compareText(
        `${current.route.originCity} ${current.route.destinationCity}`,
        `${next.route.originCity} ${next.route.destinationCity}`,
      );
    }

    if (key === 'vehicleType' || key === 'carrier') {
      return this.compareText(current.route[key], next.route[key]);
    }

    if (key === 'progress') {
      return this.compareNumber(
        current.tracking?.progressPercent ?? -1,
        next.tracking?.progressPercent ?? -1,
      );
    }

    if (key === 'eta') {
      return this.compareNumber(
        current.tracking?.etaMinutes ?? Infinity,
        next.tracking?.etaMinutes ?? Infinity,
      );
    }

    if (key === 'timestamp') {
      return this.compareNumber(
        current.tracking ? new Date(current.tracking.timestamp).getTime() : 0,
        next.tracking ? new Date(next.tracking.timestamp).getTime() : 0,
      );
    }

    return this.compareText(this.getTrackingStatus(current), this.getTrackingStatus(next));
  }

  private compareNumber(current: number, next: number): number {
    return current - next;
  }

  private compareText(current: string, next: string): number {
    return current.localeCompare(next, 'es', { sensitivity: 'base' });
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  private uniqueSorted(values: string[]): string[] {
    return [...new Set(values)].sort((current, next) => this.compareText(current, next));
  }
}
