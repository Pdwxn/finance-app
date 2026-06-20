import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createGoalSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  targetAmount: z.number().int().positive(),
  targetDate: z.string().regex(dateRegex),
});

export const updateGoalSchema = z.object({
  name: z.string().min(1).optional(),
  targetAmount: z.number().int().positive().optional(),
  targetDate: z.string().regex(dateRegex).optional(),
});
