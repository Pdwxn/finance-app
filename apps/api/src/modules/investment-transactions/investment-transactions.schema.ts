import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createInvestmentTransactionSchema = z.object({
  id: z.string().uuid(),
  investmentId: z.string().uuid(),
  type: z.enum(['buy', 'sell']),
  quantity: z.number().positive(),
  price: z.number().int().positive(),
  transactionDate: z.string().regex(dateRegex),
});

export const updateInvestmentTransactionSchema = z.object({
  investmentId: z.string().uuid().optional(),
  type: z.enum(['buy', 'sell']).optional(),
  quantity: z.number().positive().optional(),
  price: z.number().int().positive().optional(),
  transactionDate: z.string().regex(dateRegex).optional(),
});
