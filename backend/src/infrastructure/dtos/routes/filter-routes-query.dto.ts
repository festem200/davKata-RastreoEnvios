import { z } from 'zod';

import { ROUTE_STATUSES } from '../../../domain/constants/route-status.js';
import {
  boundedPositiveIntegerFromString,
  optionalSanitizedText,
  sanitizeText
} from '../../helpers/validation/sanitizers.js';
import { MAX_ROUTE_PAGE } from './list-routes-query.dto.js';

export const filterRoutesQueryDtoSchema = z
  .object({
    page: boundedPositiveIntegerFromString(MAX_ROUTE_PAGE).default(1),
    origin_city: optionalSanitizedText(120),
    destination_city: optionalSanitizedText(120),
    vehicle_type: optionalSanitizedText(80),
    vehicule_type: optionalSanitizedText(80),
    carrier: optionalSanitizedText(120),
    status: z
      .string()
      .transform((status) => sanitizeText(status).toUpperCase())
      .pipe(z.enum(ROUTE_STATUSES))
      .optional()
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
