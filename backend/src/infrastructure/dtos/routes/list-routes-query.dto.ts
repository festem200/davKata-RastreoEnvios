import { z } from 'zod';

import { boundedPositiveIntegerFromString } from '../../helpers/validation/sanitizers.js';

export const MAX_ROUTE_PAGE = 107_374_183;

export const listRoutesQueryDtoSchema = z.object({
  page: boundedPositiveIntegerFromString(MAX_ROUTE_PAGE).default(1)
});

export type ListRoutesQueryDto = z.infer<typeof listRoutesQueryDtoSchema>;
