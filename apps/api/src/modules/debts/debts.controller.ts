import type { Request, Response } from 'express';
import * as debtsService from './debts.service';
import { createDebtSchema, updateDebtSchema } from './debts.schema';

export async function getAll(req: Request, res: Response) {
  const userId = req.user!.userId;
  const data = await debtsService.getAll(userId);
  res.json({ success: true, data });
}

export async function getById(req: Request, res: Response) {
  const userId = req.user!.userId;
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ success: false, message: 'ID no proporcionado' });
    return;
  }
  const debt = await debtsService.getById(id, userId);
  if (!debt) {
    res.status(404).json({ success: false, message: 'Deuda no encontrada' });
    return;
  }
  res.json({ success: true, data: debt });
}

export async function create(req: Request, res: Response) {
  const userId = req.user!.userId;
  const parsed = createDebtSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
    return;
  }
  try {
    const debt = await debtsService.create({ ...parsed.data, userId });
    res.status(201).json({ success: true, data: debt });
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
  const parsed = updateDebtSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
    return;
  }
  try {
    const debt = await debtsService.update(id, userId, parsed.data);
    res.json({ success: true, data: debt });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    const status = message === 'Deuda no encontrada' ? 404 : 500;
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
    await debtsService.remove(id, userId);
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    const status = message === 'Deuda no encontrada' ? 404 : 500;
    res.status(status).json({ success: false, message });
  }
}
