import type { Request, Response } from 'express';
import * as goalsService from './goals.service';
import { createGoalSchema, updateGoalSchema } from './goals.schema';

export async function getAll(req: Request, res: Response) {
  const userId = req.user!.userId;
  const data = await goalsService.getAll(userId);
  res.json({ success: true, data });
}

export async function getById(req: Request, res: Response) {
  const userId = req.user!.userId;
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ success: false, message: 'ID no proporcionado' });
    return;
  }
  const goal = await goalsService.getById(id, userId);
  if (!goal) {
    res.status(404).json({ success: false, message: 'Meta no encontrada' });
    return;
  }
  res.json({ success: true, data: goal });
}

export async function create(req: Request, res: Response) {
  const userId = req.user!.userId;
  const parsed = createGoalSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
    return;
  }
  try {
    const goal = await goalsService.create({ ...parsed.data, userId });
    res.status(201).json({ success: true, data: goal });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    res.status(500).json({ success: false, message });
  }
}

export async function update(req: Request, res: Response) {
  const userId = req.user!.userId;
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ success: false, message: 'ID no proporcionado' });
    return;
  }
  const parsed = updateGoalSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
    return;
  }
  try {
    const goal = await goalsService.update(id, userId, parsed.data);
    res.json({ success: true, data: goal });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    const status = message === 'Meta no encontrada' ? 404 : 500;
    res.status(status).json({ success: false, message });
  }
}

export async function remove(req: Request, res: Response) {
  const userId = req.user!.userId;
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ success: false, message: 'ID no proporcionado' });
    return;
  }
  try {
    await goalsService.remove(id, userId);
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    const status = message === 'Meta no encontrada' ? 404 : 500;
    res.status(status).json({ success: false, message });
  }
}
