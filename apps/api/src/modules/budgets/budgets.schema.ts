import { z } from 'zod';

const periodRegex = /^\d{4}-\d{2}$/;

export const createBudgetSchema = z.object({
  id: z.string().uuid(),
  categoryId: z.string().uuid(),
  period: z.string().regex(periodRegex),
  limitAmount: z.number().int().positive(),
});

export const updateBudgetSchema = z.object({
  categoryId: z.string().uuid().optional(),
  period: z.string().regex(periodRegex).optional(),
  limitAmount: z.number().int().positive().optional(),
});
