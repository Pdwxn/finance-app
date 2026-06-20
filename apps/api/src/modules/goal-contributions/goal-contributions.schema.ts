import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createGoalContributionSchema = z.object({
  id: z.string().uuid(),
  goalId: z.string().uuid(),
  accountId: z.string().uuid(),
  amount: z.number().int().positive(),
  contributionDate: z.string().regex(dateRegex),
});

export const updateGoalContributionSchema = z.object({
  goalId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional(),
  amount: z.number().int().positive().optional(),
  contributionDate: z.string().regex(dateRegex).optional(),
});
