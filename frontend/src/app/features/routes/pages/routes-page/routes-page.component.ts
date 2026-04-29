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
  ListRoutesResponse,
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
  protected readonly routes = signal<Route[]>([]);
  protected readonly pagination = signal<ListRoutesResponse['pagination'] | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly selectedRoute = signal<Route | null>(null);
  protected readonly isFormVisible = signal(false);
  protected readonly user = inject(AuthService).getUser();
  protected readonly isAdmin = computed(() => this.user?.role === 'ADMIN');
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

  constructor() {
    this.loadRoutes(1);
  }

  protected loadRoutes(page: number): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.routesService
      .list(page)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          this.routes.set(response.data);
          this.pagination.set(response.pagination);
        },
        error: () => {
          this.routes.set([]);
          this.pagination.set(null);
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
          this.loadRoutes(this.pagination()?.page ?? 1);
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
          const currentPage = this.pagination()?.page ?? 1;
          const shouldGoBack = this.routes().length === 1 && currentPage > 1;
          this.loadRoutes(shouldGoBack ? currentPage - 1 : currentPage);
        },
        error: () => {
          this.errorMessage.set('No fue posible eliminar la ruta.');
        }
      });
  }

  protected goToPreviousPage(): void {
    const page = this.pagination()?.page ?? 1;

    if (page > 1) {
      this.loadRoutes(page - 1);
    }
  }

  protected goToNextPage(): void {
    const pagination = this.pagination();

    if (pagination && pagination.page < pagination.totalPages) {
      this.loadRoutes(pagination.page + 1);
    }
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
}
