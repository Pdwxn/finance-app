import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createCardChargeSchema = z.object({
  id: z.string().uuid(),
  creditCardId: z.string().uuid(),
  categoryId: z.string().uuid(),
  amount: z.number().int().positive(),
  description: z.string().min(1).max(255),
  transactionDate: z.string().regex(dateRegex),
  isInstallment: z.boolean().default(false),
  totalInstallments: z.number().int().min(2).max(48).nullable().default(null),
  installmentAmount: z.number().int().positive().nullable().default(null),
  interestRate: z.number().positive().nullable().default(null),
});

export const updateCardChargeSchema = z.object({
  creditCardId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  amount: z.number().int().positive().optional(),
  description: z.string().min(1).max(255).optional(),
  transactionDate: z.string().regex(dateRegex).optional(),
  isInstallment: z.boolean().optional(),
  totalInstallments: z.number().int().min(2).max(48).nullable().optional(),
  installmentAmount: z.number().int().positive().nullable().optional(),
  interestRate: z.number().positive().nullable().optional(),
});
