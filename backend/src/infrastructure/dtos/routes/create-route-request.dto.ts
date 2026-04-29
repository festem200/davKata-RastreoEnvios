import { z } from 'zod';

import { ACTIVE_ROUTE_STATUS, ROUTE_STATUSES } from '../../../domain/constants/route-status.js';
import { positiveDecimal, sanitizeText, sanitizedText } from '../../helpers/validation/sanitizers.js';

export const ROUTE_NUMERIC_LIMITS = {
  distanceKm: 99_999_999.99,
  estimatedTimeHours: 999_999.99,
  costUsd: 9_999_999_999.99
} as const;

export const createRouteRequestDtoSchema = z.object({
  originCity: sanitizedText(120),
  destinationCity: sanitizedText(120),
  distanceKm: positiveDecimal(ROUTE_NUMERIC_LIMITS.distanceKm),
  estimatedTimeHours: positiveDecimal(ROUTE_NUMERIC_LIMITS.estimatedTimeHours),
  vehicleType: sanitizedText(80),
  carrier: sanitizedText(120),
  costUsd: positiveDecimal(ROUTE_NUMERIC_LIMITS.costUsd),
  status: z
    .string()
    .transform((status) => sanitizeText(status).toUpperCase())
    .pipe(z.enum(ROUTE_STATUSES))
    .default(ACTIVE_ROUTE_STATUS)
});

export type CreateRouteRequestDto = z.infer<typeof createRouteRequestDtoSchema>;
