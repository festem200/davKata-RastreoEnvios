import { z } from 'zod';

import { ROUTE_STATUSES } from './create-route-request.dto.js';
import { MAX_ROUTE_PAGE } from './list-routes-query.dto.js';

const optionalText = (maxLength: number) => z.string().trim().min(1).max(maxLength).optional();

export const filterRoutesQueryDtoSchema = z
  .object({
    page: z.coerce.number().int().positive().max(MAX_ROUTE_PAGE).default(1),
    origin_city: optionalText(120),
    destination_city: optionalText(120),
    vehicle_type: optionalText(80),
    vehicule_type: optionalText(80),
    carrier: optionalText(120),
    status: z.enum(ROUTE_STATUSES).optional()
  })
  .transform(({ origin_city, destination_city, vehicle_type, vehicule_type, ...query }) => ({
    page: query.page,
    originCity: origin_city,
    destinationCity: destination_city,
    vehicleType: vehicle_type ?? vehicule_type,
    carrier: query.carrier,
    status: query.status
  }));

export type FilterRoutesQueryDto = z.infer<typeof filterRoutesQueryDtoSchema>;
