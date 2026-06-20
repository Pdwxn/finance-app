import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createDebtSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  initialAmount: z.number().int().positive(),
  interestRate: z.number().positive(),
  startDate: z.string().regex(dateRegex),
});

export const updateDebtSchema = z.object({
  name: z.string().min(1).optional(),
  initialAmount: z.number().int().positive().optional(),
  interestRate: z.number().positive().optional(),
  startDate: z.string().regex(dateRegex).optional(),
});
