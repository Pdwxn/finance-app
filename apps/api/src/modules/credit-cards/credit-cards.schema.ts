import { z } from 'zod';

export const createCreditCardSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  limitAmount: z.number().int(),
  closingDay: z.number().int().min(1).max(31),
  dueDay: z.number().int().min(1).max(31),
  monthlyFee: z.number().int().nullable().default(null),
  interestRate: z.number().positive().nullable().default(null),
});

export const updateCreditCardSchema = z.object({
  name: z.string().min(1).optional(),
  limitAmount: z.number().int().optional(),
  closingDay: z.number().int().min(1).max(31).optional(),
  dueDay: z.number().int().min(1).max(31).optional(),
  monthlyFee: z.number().int().nullable().optional(),
  interestRate: z.number().positive().nullable().optional(),
});
