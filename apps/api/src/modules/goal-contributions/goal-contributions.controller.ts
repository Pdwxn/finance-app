import type { Request, Response } from 'express';
import * as goalContributionsService from './goal-contributions.service';
import { createGoalContributionSchema, updateGoalContributionSchema } from './goal-contributions.schema';

export async function getAll(_req: Request, res: Response) {
  const data = await goalContributionsService.getAll();
  res.json({ success: true, data });
}

export async function getById(req: Request, res: Response) {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ success: false, message: 'ID no proporcionado' });
    return;
  }
  const contribution = await goalContributionsService.getById(id);
  if (!contribution) {
    res.status(404).json({ success: false, message: 'Contribución no encontrada' });
    return;
  }
  res.json({ success: true, data: contribution });
}

export async function create(req: Request, res: Response) {
  const parsed = createGoalContributionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
    return;
  }
  try {
    const contribution = await goalContributionsService.create(parsed.data);
    res.status(201).json({ success: true, data: contribution });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    res.status(500).json({ success: false, message });
  }
}

export async function update(req: Request, res: Response) {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ success: false, message: 'ID no proporcionado' });
    return;
  }
  const parsed = updateGoalContributionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
    return;
  }
  try {
    const contribution = await goalContributionsService.update(id, parsed.data);
    res.json({ success: true, data: contribution });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    const status = message === 'Contribución no encontrada' ? 404 : 500;
    res.status(status).json({ success: false, message });
  }
}

export async function remove(req: Request, res: Response) {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ success: false, message: 'ID no proporcionado' });
    return;
  }
  try {
    await goalContributionsService.remove(id);
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    const status = message === 'Contribución no encontrada' ? 404 : 500;
    res.status(status).json({ success: false, message });
  }
}
