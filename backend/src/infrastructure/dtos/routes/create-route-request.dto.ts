import { z } from 'zod';

import { ACTIVE_ROUTE_STATUS, ROUTE_STATUSES } from '../../../domain/constants/route-status.js';

const nonEmptyText = (maxLength: number) => z.string().trim().min(1).max(maxLength);

export const ROUTE_NUMERIC_LIMITS = {
  distanceKm: 99_999_999.99,
  estimatedTimeHours: 999_999.99,
  costUsd: 9_999_999_999.99
} as const;

export const createRouteRequestDtoSchema = z.object({
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
  status: z.enum(ROUTE_STATUSES).default(ACTIVE_ROUTE_STATUS)
});

export type CreateRouteRequestDto = z.infer<typeof createRouteRequestDtoSchema>;
