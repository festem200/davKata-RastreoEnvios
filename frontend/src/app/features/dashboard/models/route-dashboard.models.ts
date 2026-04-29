import { Route, RouteStatus } from '../../../core/models/route.model';

export type { Route, RouteStatus };

export interface StatusTotal {
  status: RouteStatus;
  label: string;
  value: number;
  color: string;
}

export interface RegionHeatmapItem {
  region: string;
  label: string;
  activeRoutes: number;
}

export interface RouteDashboardStats {
  totalRoutes: number;
  statusTotals: StatusTotal[];
  topCostRoutes: Route[];
  activeRoutesByRegion: RegionHeatmapItem[];
}

export interface DashboardDateRange {
  startDate: string | null;
  endDate: string | null;
}
