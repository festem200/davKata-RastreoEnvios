import { Component, input } from '@angular/core';

export interface RankedRouteItem {
  id: string;
  title: string;
  subtitle: string;
  value: string;
}

@Component({
  selector: 'app-ranked-routes',
  templateUrl: './ranked-routes.component.html',
  styleUrl: './ranked-routes.component.scss'
})
export class RankedRoutesComponent {
  readonly title = input.required<string>();
  readonly items = input.required<RankedRouteItem[]>();
}
