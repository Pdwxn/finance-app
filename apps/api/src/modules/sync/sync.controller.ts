import type { Request, Response } from 'express';
import { syncRequestSchema } from './sync.schema';
import { processOperations } from './sync.service';

export async function sync(req: Request, res: Response) {
  const userId = req.user!.userId;
  const parsed = syncRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
    return;
  }
  try {
    const results = await processOperations(parsed.data.operations, userId);
    res.json({ success: true, data: { results } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    res.status(500).json({ success: false, message });
  }
}
