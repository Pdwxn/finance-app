import type { Request, Response } from 'express';
import * as categoriesService from './categories.service';
import { createCategorySchema, updateCategorySchema } from './categories.schema';

export async function getAll(req: Request, res: Response) {
  const userId = req.user!.userId;
  const data = await categoriesService.getAll(userId);
  res.json({ success: true, data });
}

export async function getById(req: Request, res: Response) {
  const userId = req.user!.userId;
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ success: false, message: 'ID no proporcionado' });
    return;
  }
  const category = await categoriesService.getById(id, userId);
  if (!category) {
    res.status(404).json({ success: false, message: 'Categoría no encontrada' });
    return;
  }
  res.json({ success: true, data: category });
}

export async function create(req: Request, res: Response) {
  const userId = req.user!.userId;
  const parsed = createCategorySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
    return;
  }
  try {
    const category = await categoriesService.create({ ...parsed.data, userId });
    res.status(201).json({ success: true, data: category });
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
  const parsed = updateCategorySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
    return;
  }
  try {
    const category = await categoriesService.update(id, userId, parsed.data);
    res.json({ success: true, data: category });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    const status = message === 'Categoría no encontrada' ? 404 : 500;
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
    await categoriesService.remove(id, userId);
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    const status = message === 'Categoría no encontrada' ? 404 : 500;
    res.status(status).json({ success: false, message });
  }
}
