import { z } from 'zod';

export const syncOperationSchema = z.object({
  id: z.string().uuid(),
  operation: z.enum(['create', 'update', 'delete']),
  entity: z.string().min(1),
  entityId: z.string().uuid(),
  payload: z.record(z.unknown()),
  createdAt: z.string().datetime(),
});

export const syncRequestSchema = z.object({
  operations: z.array(syncOperationSchema),
});
