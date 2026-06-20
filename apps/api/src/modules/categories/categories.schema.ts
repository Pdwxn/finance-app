import { z } from 'zod';

export const createCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  type: z.enum(['expense', 'income']),
  icon: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(['expense', 'income']).optional(),
  icon: z.string().min(1).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});
