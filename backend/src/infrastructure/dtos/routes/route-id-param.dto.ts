import { z } from 'zod';

import { sanitizeText } from '../../helpers/validation/sanitizers.js';

export const MAX_ROUTE_ID = 9_223_372_036_854_775_807n;

export const routeIdParamDtoSchema = z.object({
  id: z
    .string()
    .transform(sanitizeText)
    .pipe(z.string().regex(/^\d+$/))
    .refine((id: string) => {
      if (!/^\d+$/.test(id)) {
        return false;
      }

      const routeId = BigInt(id);

      return routeId > 0n && routeId <= MAX_ROUTE_ID;
    })
});

export type RouteIdParamDto = z.infer<typeof routeIdParamDtoSchema>;
