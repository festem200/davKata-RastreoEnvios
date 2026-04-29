import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { finalize } from 'rxjs';

import {
  Route,
  RoutePayload,
  RouteStatus
} from '../../../../core/models/route.model';
import { AuthService } from '../../../auth/services/auth.service';
import { AppShellComponent } from '../../../../shared/components/app-shell/app-shell.component';
import { RoutesService } from '../../services/routes.service';

interface RouteForm {
  originCity: FormControl<string>;
  destinationCity: FormControl<string>;
  distanceKm: FormControl<number>;
  estimatedTimeHours: FormControl<number>;
  vehicleType: FormControl<string>;
  carrier: FormControl<string>;
  costUsd: FormControl<number>;
  status: FormControl<RouteStatus>;
}

interface RouteFilterForm {
  search: FormControl<string>;
  status: FormControl<RouteStatus | 'TODOS'>;
  vehicleType: FormControl<string>;
  carrier: FormControl<string>;
}

interface RouteFilters {
  search: string;
  status: RouteStatus | 'TODOS';
  vehicleType: string;
  carrier: string;
}

type SortKey =
  | 'route'
  | 'vehicleType'
  | 'carrier'
  | 'distanceKm'
  | 'estimatedTimeHours'
  | 'costUsd'
  | 'status';

type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-routes-page',
  imports: [CommonModule, ReactiveFormsModule, AppShellComponent],
  templateUrl: './routes-page.component.html',
  styleUrl: './routes-page.component.scss'
})
export class RoutesPageComponent {
  private readonly routesService = inject(RoutesService);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly currencyFormatter = new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: 0,
    style: 'currency'
  });

  protected readonly statuses: RouteStatus[] = [
    'ACTIVA',
    'INACTIVA',
    'EN_MANTENIMIENTO',
    'SUSPENDIDA'
  ];
  protected readonly pageSizeOptions = [10, 20, 50];
  protected readonly allRoutes = signal<Route[]>([]);
  protected readonly filters = signal<RouteFilters>({
    search: '',
    status: 'TODOS',
    vehicleType: 'TODOS',
    carrier: 'TODOS'
  });
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly sortKey = signal<SortKey>('route');
  protected readonly sortDirection = signal<SortDirection>('asc');
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly selectedRoute = signal<Route | null>(null);
  protected readonly isFormVisible = signal(false);
  protected readonly user = inject(AuthService).getUser();
  protected readonly isAdmin = computed(() => this.user?.role === 'ADMIN');
  protected readonly filterForm = this.formBuilder.group<RouteFilterForm>({
    search: this.formBuilder.control(''),
    status: this.formBuilder.control<RouteStatus | 'TODOS'>('TODOS'),
    vehicleType: this.formBuilder.control('TODOS'),
    carrier: this.formBuilder.control('TODOS')
  });
  protected readonly routeForm = this.formBuilder.group<RouteForm>({
    originCity: this.formBuilder.control('', [Validators.required, Validators.maxLength(120)]),
    destinationCity: this.formBuilder.control('', [Validators.required, Validators.maxLength(120)]),
    distanceKm: this.formBuilder.control(1, [Validators.required, Validators.min(0.01)]),
    estimatedTimeHours: this.formBuilder.control(1, [Validators.required, Validators.min(0.01)]),
    vehicleType: this.formBuilder.control('', [Validators.required, Validators.maxLength(80)]),
    carrier: this.formBuilder.control('', [Validators.required, Validators.maxLength(120)]),
    costUsd: this.formBuilder.control(1, [Validators.required, Validators.min(0.01)]),
    status: this.formBuilder.control('ACTIVA', [Validators.required])
  });
  protected readonly filteredRoutes = computed(() => {
    const filters = this.filters();
    const search = this.normalizeText(filters.search);

    return this.allRoutes().filter((route) => {
      const matchesSearch =
        !search ||
        this.normalizeText(
          `${route.originCity} ${route.destinationCity} ${route.carrier} ${route.vehicleType}`
        ).includes(search);
      const matchesStatus = filters.status === 'TODOS' || route.status === filters.status;
      const matchesVehicleType =
        filters.vehicleType === 'TODOS' || route.vehicleType === filters.vehicleType;
      const matchesCarrier = filters.carrier === 'TODOS' || route.carrier === filters.carrier;

      return matchesSearch && matchesStatus && matchesVehicleType && matchesCarrier;
    });
  });
  protected readonly sortedRoutes = computed(() => {
    const key = this.sortKey();
    const direction = this.sortDirection();

    return [...this.filteredRoutes()].sort((current, next) => {
      const result = this.compareRoutes(current, next, key);
      return direction === 'asc' ? result : -result;
    });
  });
  protected readonly routes = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.sortedRoutes().slice(start, start + this.pageSize());
  });
  protected readonly pagination = computed(() => {
    const total = this.filteredRoutes().length;
    const perPage = this.pageSize();
    const totalPages = Math.max(1, Math.ceil(total / perPage));

    return {
      page: Math.min(this.currentPage(), totalPages),
      perPage,
      total,
      totalPages
    };
  });
  protected readonly vehicleTypes = computed(() =>
    this.uniqueSorted(this.allRoutes().map((route) => route.vehicleType))
  );
  protected readonly carriers = computed(() =>
    this.uniqueSorted(this.allRoutes().map((route) => route.carrier))
  );

  constructor() {
    this.filterForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.filters.set(this.filterForm.getRawValue());
      this.currentPage.set(1);
    });
    this.loadRoutes();
  }

  protected loadRoutes(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.routesService
      .listAll()
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (routes) => {
          this.allRoutes.set(routes);
          this.clampCurrentPage();
        },
        error: () => {
          this.allRoutes.set([]);
          this.errorMessage.set('No fue posible cargar las rutas.');
        }
      });
  }

  protected showCreateForm(): void {
    this.selectedRoute.set(null);
    this.routeForm.reset({
      originCity: '',
      destinationCity: '',
      distanceKm: 1,
      estimatedTimeHours: 1,
      vehicleType: '',
      carrier: '',
      costUsd: 1,
      status: 'ACTIVA'
    });
    this.routeForm.markAsPristine();
    this.routeForm.markAsUntouched();
    this.isFormVisible.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  protected showEditForm(route: Route): void {
    this.selectedRoute.set(route);
    this.routeForm.setValue({
      originCity: route.originCity,
      destinationCity: route.destinationCity,
      distanceKm: route.distanceKm,
      estimatedTimeHours: route.estimatedTimeHours,
      vehicleType: route.vehicleType,
      carrier: route.carrier,
      costUsd: route.costUsd,
      status: route.status
    });
    this.routeForm.markAsPristine();
    this.routeForm.markAsUntouched();
    this.isFormVisible.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  protected cancelForm(): void {
    this.isFormVisible.set(false);
    this.selectedRoute.set(null);
    this.routeForm.markAsPristine();
    this.routeForm.markAsUntouched();
  }

  protected saveRoute(): void {
    if (!this.isAdmin()) {
      return;
    }

    if (this.routeForm.invalid) {
      this.routeForm.markAllAsTouched();
      return;
    }

    const currentRoute = this.selectedRoute();
    const payload = this.buildPayload();
    const request = currentRoute
      ? this.routesService.update(currentRoute.id, payload)
      : this.routesService.create(payload);

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    request
      .pipe(
        finalize(() => this.isSaving.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.successMessage.set(currentRoute ? 'Ruta actualizada.' : 'Ruta creada.');
          this.isFormVisible.set(false);
          this.selectedRoute.set(null);
          this.loadRoutes();
        },
        error: () => {
          this.errorMessage.set('No fue posible guardar la ruta.');
        }
      });
  }

  protected deleteRoute(route: Route): void {
    if (!this.isAdmin()) {
      return;
    }

    const confirmed = window.confirm(
      `Esta accion eliminara la ruta ${route.originCity} - ${route.destinationCity}.`
    );

    if (!confirmed) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.routesService
      .delete(route.id)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.successMessage.set('Ruta eliminada.');
          if (this.routes().length === 1 && this.currentPage() > 1) {
            this.currentPage.update((page) => page - 1);
          }
          this.loadRoutes();
        },
        error: () => {
          this.errorMessage.set('No fue posible eliminar la ruta.');
        }
      });
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

  protected resetFilters(): void {
    const filters: RouteFilters = {
      search: '',
      status: 'TODOS',
      vehicleType: 'TODOS',
      carrier: 'TODOS'
    };

    this.filterForm.reset(filters);
    this.filters.set(filters);
    this.currentPage.set(1);
  }

  protected sortLabel(key: SortKey): string {
    if (this.sortKey() !== key) {
      return '';
    }

    return this.sortDirection() === 'asc' ? 'ASC' : 'DESC';
  }

  protected hasFieldError(fieldName: keyof RouteForm, errorName: string): boolean {
    const field = this.routeForm.controls[fieldName];
    return field.hasError(errorName) && (field.dirty || field.touched);
  }

  protected formatCurrency(value: number): string {
    return this.currencyFormatter.format(value);
  }

  private buildPayload(): RoutePayload {
    const value = this.routeForm.getRawValue();

    return {
      ...value,
      distanceKm: Number(value.distanceKm),
      estimatedTimeHours: Number(value.estimatedTimeHours),
      costUsd: Number(value.costUsd)
    };
  }

  private clampCurrentPage(): void {
    const totalPages = this.pagination().totalPages;

    if (this.currentPage() > totalPages) {
      this.currentPage.set(totalPages);
    }
  }

  private compareRoutes(current: Route, next: Route, key: SortKey): number {
    if (key === 'route') {
      return this.compareText(
        `${current.originCity} ${current.destinationCity}`,
        `${next.originCity} ${next.destinationCity}`
      );
    }

    if (key === 'distanceKm' || key === 'estimatedTimeHours' || key === 'costUsd') {
      return current[key] - next[key];
    }

    return this.compareText(current[key], next[key]);
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
