export const ROUTE_STATUSES = ['ACTIVA', 'INACTIVA', 'EN_MANTENIMIENTO', 'SUSPENDIDA'] as const;

export type RouteStatus = (typeof ROUTE_STATUSES)[number];

export const ACTIVE_ROUTE_STATUS: RouteStatus = 'ACTIVA';
export const INACTIVE_ROUTE_STATUS: RouteStatus = 'INACTIVA';
