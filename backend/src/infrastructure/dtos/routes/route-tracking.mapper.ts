import type { RouteTracking } from '../../../domain/entities/route-tracking.js';
import type { RouteTrackingResponseDto } from './route-tracking-response.dto.js';

export const toRouteTrackingResponseDto = (
  tracking: RouteTracking
): RouteTrackingResponseDto => ({
  routeId: tracking.routeId,
  lastLocation: tracking.lastLocation,
  progressPercent: tracking.progressPercent,
  etaMinutes: tracking.etaMinutes,
  timestamp: tracking.timestamp
});
