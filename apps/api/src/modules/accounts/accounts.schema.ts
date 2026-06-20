import { z } from 'zod';

export const createAccountSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  type: z.enum(['cash', 'checking', 'savings', 'investment', 'credit']),
  currency: z.string().min(1).max(5),
  initialBalance: z.number().int(),
});

export const updateAccountSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(['cash', 'checking', 'savings', 'investment', 'credit']).optional(),
  currency: z.string().min(1).max(5).optional(),
  initialBalance: z.number().int().optional(),
});
