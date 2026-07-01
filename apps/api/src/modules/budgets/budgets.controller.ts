import type { Request, Response } from 'express';
import * as budgetsService from './budgets.service';
import { createBudgetSchema, updateBudgetSchema } from './budgets.schema';

export async function getAll(req: Request, res: Response) {
  const userId = req.user!.userId;
  const data = await budgetsService.getAll(userId);
  res.json({ success: true, data });
}

export async function getByPeriod(req: Request, res: Response) {
  const userId = req.user!.userId;
  const period = req.query.period as string;
  if (!period || !/^\d{4}-\d{2}$/.test(period)) {
    res.status(400).json({ success: false, message: 'Parámetro period inválido (formato YYYY-MM)' });
    return;
  }
  const data = await budgetsService.getByPeriod(userId, period);
  res.json({ success: true, data });
}

export async function getById(req: Request, res: Response) {
  const userId = req.user!.userId;
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ success: false, message: 'ID no proporcionado' });
    return;
  }
  const budget = await budgetsService.getById(id, userId);
  if (!budget) {
    res.status(404).json({ success: false, message: 'Presupuesto no encontrado' });
    return;
  }
  res.json({ success: true, data: budget });
}

export async function create(req: Request, res: Response) {
  const userId = req.user!.userId;
  const parsed = createBudgetSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
    return;
  }
  try {
    const budget = await budgetsService.create({ ...parsed.data, userId });
    res.status(201).json({ success: true, data: budget });
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
  const parsed = updateBudgetSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
    return;
  }
  try {
    const budget = await budgetsService.update(id, userId, parsed.data);
    res.json({ success: true, data: budget });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    const status = message === 'Presupuesto no encontrado' ? 404 : 500;
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
    await budgetsService.remove(id, userId);
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    const status = message === 'Presupuesto no encontrado' ? 404 : 500;
    res.status(status).json({ success: false, message });
  }
}
