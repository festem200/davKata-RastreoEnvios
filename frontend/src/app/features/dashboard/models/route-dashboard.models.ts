import { Route, RouteStatus } from '../../../core/models/route.model';

export type { Route, RouteStatus };

export interface StatusTotal {
  status: RouteStatus;
  label: string;
  value: number;
  color: string;
}

export interface RouteDashboardStats {
  totalRoutes: number;
  statusTotals: StatusTotal[];
  topCostRoutes: Route[];
}
