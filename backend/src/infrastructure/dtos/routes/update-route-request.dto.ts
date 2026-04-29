import { z } from 'zod';

import { ROUTE_STATUSES } from '../../../domain/constants/route-status.js';
import { positiveDecimal, sanitizeText, sanitizedText } from '../../helpers/validation/sanitizers.js';
import { ROUTE_NUMERIC_LIMITS } from './create-route-request.dto.js';

export const updateRouteRequestDtoSchema = z.object({
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
});

export type UpdateRouteRequestDto = z.infer<typeof updateRouteRequestDtoSchema>;
