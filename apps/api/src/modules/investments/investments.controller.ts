import type { Request, Response } from 'express';
import * as investmentsService from './investments.service';
import { createInvestmentSchema, updateInvestmentSchema } from './investments.schema';

export async function getAll(req: Request, res: Response) {
  const userId = req.user!.userId;
  const data = await investmentsService.getAll(userId);
  res.json({ success: true, data });
}

export async function getById(req: Request, res: Response) {
  const userId = req.user!.userId;
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ success: false, message: 'ID no proporcionado' });
    return;
  }
  const investment = await investmentsService.getById(id, userId);
  if (!investment) {
    res.status(404).json({ success: false, message: 'Inversión no encontrada' });
    return;
  }
  res.json({ success: true, data: investment });
}

export async function create(req: Request, res: Response) {
  const userId = req.user!.userId;
  const parsed = createInvestmentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
    return;
  }
  try {
    const investment = await investmentsService.create({ ...parsed.data, userId });
    res.status(201).json({ success: true, data: investment });
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
  const parsed = updateInvestmentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
    return;
  }
  try {
    const investment = await investmentsService.update(id, userId, parsed.data);
    res.json({ success: true, data: investment });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    const status = message === 'Inversión no encontrada' ? 404 : 500;
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
    await investmentsService.remove(id, userId);
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    const status = message === 'Inversión no encontrada' ? 404 : 500;
    res.status(status).json({ success: false, message });
  }
}
