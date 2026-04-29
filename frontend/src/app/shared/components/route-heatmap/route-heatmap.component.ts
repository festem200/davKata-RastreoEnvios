import { Component, computed, input } from '@angular/core';

export interface RouteHeatmapItem {
  region: string;
  label: string;
  activeRoutes: number;
}

interface RouteHeatmapViewItem extends RouteHeatmapItem {
  intensity: number;
  percent: number;
}

@Component({
  selector: 'app-route-heatmap',
  templateUrl: './route-heatmap.component.html',
  styleUrl: './route-heatmap.component.scss'
})
export class RouteHeatmapComponent {
  readonly title = input.required<string>();
  readonly items = input.required<RouteHeatmapItem[]>();

  protected readonly total = computed(() =>
    this.items().reduce((total, item) => total + item.activeRoutes, 0)
  );

  protected readonly max = computed(() =>
    Math.max(...this.items().map((item) => item.activeRoutes), 0)
  );

  protected readonly viewItems = computed<RouteHeatmapViewItem[]>(() =>
    this.items().map((item) => {
      const max = this.max();
      const percent = max > 0 ? item.activeRoutes / max : 0;

      return {
        ...item,
        percent,
        intensity: this.resolveIntensity(percent)
      };
    })
  );

  private resolveIntensity(percent: number): number {
    if (percent === 0) {
      return 0;
    }

    if (percent <= 0.25) {
      return 1;
    }

    if (percent <= 0.5) {
      return 2;
    }

    if (percent <= 0.75) {
      return 3;
    }

    return 4;
  }
}
