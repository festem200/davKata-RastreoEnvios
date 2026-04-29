import { z } from 'zod';

import { ROUTE_STATUSES } from '../../../domain/constants/route-status.js';
import { ROUTE_NUMERIC_LIMITS } from './create-route-request.dto.js';

const nonEmptyText = (maxLength: number) => z.string().trim().min(1).max(maxLength);

export const updateRouteRequestDtoSchema = z.object({
  originCity: nonEmptyText(120),
  destinationCity: nonEmptyText(120),
  distanceKm: z.coerce.number().finite().positive().max(ROUTE_NUMERIC_LIMITS.distanceKm),
  estimatedTimeHours: z.coerce
    .number()
    .finite()
    .positive()
    .max(ROUTE_NUMERIC_LIMITS.estimatedTimeHours),
  vehicleType: nonEmptyText(80),
  carrier: nonEmptyText(120),
  costUsd: z.coerce.number().finite().positive().max(ROUTE_NUMERIC_LIMITS.costUsd),
  status: z.enum(ROUTE_STATUSES)
});

export type UpdateRouteRequestDto = z.infer<typeof updateRouteRequestDtoSchema>;
