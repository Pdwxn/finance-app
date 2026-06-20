import { z } from 'zod';

export const createInvestmentSchema = z.object({
  id: z.string().uuid(),
  symbol: z.string().min(1),
  name: z.string().min(1),
  quantity: z.number().positive(),
  averageCost: z.number().int().positive(),
});

export const updateInvestmentSchema = z.object({
  symbol: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  quantity: z.number().positive().optional(),
  averageCost: z.number().int().positive().optional(),
});
