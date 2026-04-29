import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { DoughnutChartComponent } from '../../../shared/components/doughnut-chart/doughnut-chart.component';
import { MetricCardComponent } from '../../../shared/components/metric-card/metric-card.component';
import { AppShellComponent } from '../../../shared/components/app-shell/app-shell.component';
import {
  RankedRouteItem,
  RankedRoutesComponent
} from '../../../shared/components/ranked-routes/ranked-routes.component';
import { AuthService } from '../../auth/services/auth.service';
import { RouteDashboardStats, RouteStatus } from '../models/route-dashboard.models';
import { RouteDashboardService } from '../services/route-dashboard.service';

@Component({
  selector: 'app-dashboard-page',
  imports: [
    CommonModule,
    AppShellComponent,
    DoughnutChartComponent,
    MetricCardComponent,
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
  protected readonly statusTotals = computed(() => this.stats()?.statusTotals ?? []);
  protected readonly activeRoutes = computed(() => this.getStatusValue('ACTIVA'));
  protected readonly maintenanceRoutes = computed(() => this.getStatusValue('EN_MANTENIMIENTO'));
  protected readonly suspendedRoutes = computed(() => this.getStatusValue('SUSPENDIDA'));
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

  private loadStats(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.dashboardService
      .getStats()
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
}
