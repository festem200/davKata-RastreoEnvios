import { z } from 'zod';

import { sanitizeText } from '../../helpers/validation/sanitizers.js';

export const loginRequestDtoSchema = z.object({
  email: z
    .string()
    .transform((email) => sanitizeText(email).toLowerCase())
    .pipe(z.string().email().max(254)),
  password: z.string().min(1).max(128)
});

export type LoginRequestDto = z.infer<typeof loginRequestDtoSchema>;
