import { z } from 'zod';

export const MAX_ROUTE_PAGE = 107_374_183;

export const listRoutesQueryDtoSchema = z.object({
  page: z.coerce.number().int().positive().max(MAX_ROUTE_PAGE).default(1)
});

export type ListRoutesQueryDto = z.infer<typeof listRoutesQueryDtoSchema>;
