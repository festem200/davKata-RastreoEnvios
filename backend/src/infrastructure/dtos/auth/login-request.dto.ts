import { z } from 'zod';

export const loginRequestDtoSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1)
});

export type LoginRequestDto = z.infer<typeof loginRequestDtoSchema>;
