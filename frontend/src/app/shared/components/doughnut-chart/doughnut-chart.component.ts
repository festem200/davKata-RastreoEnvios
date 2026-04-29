import { Component, computed, input } from '@angular/core';

export interface DoughnutChartItem {
  label: string;
  value: number;
  color: string;
}

interface DoughnutChartSegment extends DoughnutChartItem {
  offset: number;
  percent: number;
}

@Component({
  selector: 'app-doughnut-chart',
  templateUrl: './doughnut-chart.component.html',
  styleUrl: './doughnut-chart.component.scss'
})
export class DoughnutChartComponent {
  readonly title = input.required<string>();
  readonly items = input.required<DoughnutChartItem[]>();

  protected readonly total = computed(() =>
    this.items().reduce((total, item) => total + item.value, 0)
  );

  protected readonly segments = computed<DoughnutChartSegment[]>(() => {
    let offset = 0;
    const total = this.total();

    return this.items().map((item) => {
      const percent = total > 0 ? (item.value / total) * 100 : 0;
      const segment = {
        ...item,
        offset,
        percent
      };

      offset += percent;
      return segment;
    });
  });
}
