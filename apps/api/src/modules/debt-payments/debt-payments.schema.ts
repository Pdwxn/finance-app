import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createDebtPaymentSchema = z.object({
  id: z.string().uuid(),
  debtId: z.string().uuid(),
  accountId: z.string().uuid(),
  amount: z.number().int().positive(),
  paymentDate: z.string().regex(dateRegex),
});

export const updateDebtPaymentSchema = z.object({
  debtId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional(),
  amount: z.number().int().positive().optional(),
  paymentDate: z.string().regex(dateRegex).optional(),
});
