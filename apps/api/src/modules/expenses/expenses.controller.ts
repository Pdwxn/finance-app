import type { Request, Response } from 'express';
import * as expensesService from './expenses.service';
import { createExpenseSchema, updateExpenseSchema } from './expenses.schema';

export async function getAll(req: Request, res: Response) {
  const userId = req.user!.userId;
  const data = await expensesService.getAll(userId);
  res.json({ success: true, data });
}

export async function getById(req: Request, res: Response) {
  const userId = req.user!.userId;
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ success: false, message: 'ID no proporcionado' });
    return;
  }
  const expense = await expensesService.getById(id, userId);
  if (!expense) {
    res.status(404).json({ success: false, message: 'Gasto no encontrado' });
    return;
  }
  res.json({ success: true, data: expense });
}

export async function create(req: Request, res: Response) {
  const userId = req.user!.userId;
  const parsed = createExpenseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
    return;
  }
  try {
    const expense = await expensesService.create({ ...parsed.data, userId });
    res.status(201).json({ success: true, data: expense });
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
  const parsed = updateExpenseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
    return;
  }
  try {
    const expense = await expensesService.update(id, userId, parsed.data);
    res.json({ success: true, data: expense });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    const status = message === 'Gasto no encontrado' ? 404 : 500;
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
    await expensesService.remove(id, userId);
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    const status = message === 'Gasto no encontrado' ? 404 : 500;
    res.status(status).json({ success: false, message });
  }
}
