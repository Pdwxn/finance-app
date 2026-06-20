import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createTransferSchema = z.object({
  id: z.string().uuid(),
  fromAccountId: z.string().uuid(),
  toAccountId: z.string().uuid(),
  amount: z.number().int().positive(),
  description: z.string().min(1).max(255),
  transactionDate: z.string().regex(dateRegex),
}).refine(data => data.fromAccountId !== data.toAccountId, {
  message: 'Las cuentas origen y destino deben ser diferentes',
  path: ['toAccountId'],
});

export const updateTransferSchema = z.object({
  fromAccountId: z.string().uuid().optional(),
  toAccountId: z.string().uuid().optional(),
  amount: z.number().int().positive().optional(),
  description: z.string().min(1).max(255).optional(),
  transactionDate: z.string().regex(dateRegex).optional(),
});
