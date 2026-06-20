import type { Request, Response } from 'express';
import * as incomesService from './incomes.service';
import { createIncomeSchema, updateIncomeSchema } from './incomes.schema';

export async function getAll(req: Request, res: Response) {
  const userId = req.user!.userId;
  const data = await incomesService.getAll(userId);
  res.json({ success: true, data });
}

export async function getById(req: Request, res: Response) {
  const userId = req.user!.userId;
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ success: false, message: 'ID no proporcionado' });
    return;
  }
  const income = await incomesService.getById(id, userId);
  if (!income) {
    res.status(404).json({ success: false, message: 'Ingreso no encontrado' });
    return;
  }
  res.json({ success: true, data: income });
}

export async function create(req: Request, res: Response) {
  const userId = req.user!.userId;
  const parsed = createIncomeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
    return;
  }
  try {
    const income = await incomesService.create({ ...parsed.data, userId });
    res.status(201).json({ success: true, data: income });
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
  const parsed = updateIncomeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
    return;
  }
  try {
    const income = await incomesService.update(id, userId, parsed.data);
    res.json({ success: true, data: income });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    const status = message === 'Ingreso no encontrado' ? 404 : 500;
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
    await incomesService.remove(id, userId);
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    const status = message === 'Ingreso no encontrado' ? 404 : 500;
    res.status(status).json({ success: false, message });
  }
}
