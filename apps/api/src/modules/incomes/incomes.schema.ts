import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createIncomeSchema = z.object({
  id: z.string().uuid(),
  accountId: z.string().uuid(),
  categoryId: z.string().uuid(),
  amount: z.number().int().positive(),
  description: z.string().min(1).max(255),
  transactionDate: z.string().regex(dateRegex),
});

export const updateIncomeSchema = z.object({
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  amount: z.number().int().positive().optional(),
  description: z.string().min(1).max(255).optional(),
  transactionDate: z.string().regex(dateRegex).optional(),
});
