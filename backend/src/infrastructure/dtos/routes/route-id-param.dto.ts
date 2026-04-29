import { z } from 'zod';

export const MAX_ROUTE_ID = 9_223_372_036_854_775_807n;

export const routeIdParamDtoSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/)
    .refine((id) => {
      if (!/^\d+$/.test(id)) {
        return false;
      }

      const routeId = BigInt(id);

      return routeId > 0n && routeId <= MAX_ROUTE_ID;
    })
});

export type RouteIdParamDto = z.infer<typeof routeIdParamDtoSchema>;
