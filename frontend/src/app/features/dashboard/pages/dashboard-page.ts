import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { DoughnutChartComponent } from '../../../shared/components/doughnut-chart/doughnut-chart.component';
import { MetricCardComponent } from '../../../shared/components/metric-card/metric-card.component';
import { AppShellComponent } from '../../../shared/components/app-shell/app-shell.component';
import { RouteHeatmapComponent } from '../../../shared/components/route-heatmap/route-heatmap.component';
import {
  RankedRouteItem,
  RankedRoutesComponent
} from '../../../shared/components/ranked-routes/ranked-routes.component';
import { AuthService } from '../../auth/services/auth.service';
import {
  DashboardDateRange,
  RouteDashboardStats,
  RouteStatus
} from '../models/route-dashboard.models';
import { RouteDashboardService } from '../services/route-dashboard.service';

interface DashboardDateRangeForm {
  startDate: FormControl<string>;
  endDate: FormControl<string>;
}

@Component({
  selector: 'app-dashboard-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppShellComponent,
    DoughnutChartComponent,
    MetricCardComponent,
    RouteHeatmapComponent,
    RankedRoutesComponent
  ],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss'
})
export class DashboardPage {
  protected readonly authService = inject(AuthService);
  protected readonly user = this.authService.getUser();
  protected readonly stats = signal<RouteDashboardStats | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly dateRangeError = signal<string | null>(null);
  protected readonly appliedDateRange = signal<DashboardDateRange>({
    startDate: null,
    endDate: null
  });
  protected readonly statusTotals = computed(() => this.stats()?.statusTotals ?? []);
  protected readonly activeRoutesByRegion = computed(() => this.stats()?.activeRoutesByRegion ?? []);
  protected readonly activeRoutes = computed(() => this.getStatusValue('ACTIVA'));
  protected readonly maintenanceRoutes = computed(() => this.getStatusValue('EN_MANTENIMIENTO'));
  protected readonly suspendedRoutes = computed(() => this.getStatusValue('SUSPENDIDA'));
  protected readonly dateRangeForm = inject(NonNullableFormBuilder).group<DashboardDateRangeForm>({
    startDate: new FormControl('', { nonNullable: true }),
    endDate: new FormControl('', { nonNullable: true })
  });
  protected readonly hasDateRangeFilter = computed(() => {
    const dateRange = this.appliedDateRange();

    return Boolean(dateRange.startDate || dateRange.endDate);
  });
  protected readonly dateRangeLabel = computed(() => {
    const dateRange = this.appliedDateRange();

    if (dateRange.startDate && dateRange.endDate) {
      return `Desde ${dateRange.startDate} hasta ${dateRange.endDate}`;
    }

    if (dateRange.startDate) {
      return `Desde ${dateRange.startDate}`;
    }

    if (dateRange.endDate) {
      return `Hasta ${dateRange.endDate}`;
    }

    return 'Historico completo';
  });
  protected readonly topCostRoutes = computed<RankedRouteItem[]>(() =>
    (this.stats()?.topCostRoutes ?? []).map((route) => ({
      id: route.id,
      title: `${route.originCity} - ${route.destinationCity}`,
      subtitle: `${route.carrier} - ${route.vehicleType} - ${route.distanceKm} km`,
      value: this.currencyFormatter.format(route.costUsd)
    }))
  );

  private readonly dashboardService = inject(RouteDashboardService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly currencyFormatter = new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: 0,
    style: 'currency'
  });

  constructor() {
    this.loadStats();
  }

  protected retry(): void {
    this.loadStats();
  }

  protected applyDateRange(): void {
    const dateRange = this.getDateRangeFromForm();

    if (!this.isValidDateRange(dateRange)) {
      this.dateRangeError.set('La fecha inicial no puede ser mayor que la fecha final.');
      return;
    }

    this.dateRangeError.set(null);
    this.appliedDateRange.set(dateRange);
    this.loadStats();
  }

  protected clearDateRange(): void {
    const dateRange: DashboardDateRange = {
      startDate: null,
      endDate: null
    };

    this.dateRangeForm.reset({
      startDate: '',
      endDate: ''
    });
    this.dateRangeError.set(null);
    this.appliedDateRange.set(dateRange);
    this.loadStats();
  }

  private loadStats(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.dashboardService
      .getStats(this.appliedDateRange())
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (stats) => this.stats.set(stats),
        error: () => {
          this.stats.set(null);
          this.errorMessage.set('No fue posible cargar los indicadores de rutas.');
        }
      });
  }

  private getStatusValue(status: RouteStatus): number {
    return this.stats()?.statusTotals.find((item) => item.status === status)?.value ?? 0;
  }

  private getDateRangeFromForm(): DashboardDateRange {
    const value = this.dateRangeForm.getRawValue();

    return {
      startDate: value.startDate || null,
      endDate: value.endDate || null
    };
  }

  private isValidDateRange(dateRange: DashboardDateRange): boolean {
    if (!dateRange.startDate || !dateRange.endDate) {
      return true;
    }

    return dateRange.startDate <= dateRange.endDate;
  }
}
