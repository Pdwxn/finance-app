import { z } from 'zod';

export const listReportsSchema = z.object({
  type: z.enum(['weekly', 'monthly']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export const generateReportSchema = z.object({
  type: z.enum(['weekly', 'monthly']),
});
