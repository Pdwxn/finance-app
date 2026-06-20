import type { Request, Response } from 'express';
import * as transfersService from './transfers.service';
import { createTransferSchema, updateTransferSchema } from './transfers.schema';

export async function getAll(req: Request, res: Response) {
  const userId = req.user!.userId;
  const data = await transfersService.getAll(userId);
  res.json({ success: true, data });
}

export async function getById(req: Request, res: Response) {
  const userId = req.user!.userId;
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ success: false, message: 'ID no proporcionado' });
    return;
  }
  const transfer = await transfersService.getById(id, userId);
  if (!transfer) {
    res.status(404).json({ success: false, message: 'Transferencia no encontrada' });
    return;
  }
  res.json({ success: true, data: transfer });
}

export async function create(req: Request, res: Response) {
  const userId = req.user!.userId;
  const parsed = createTransferSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
    return;
  }
  try {
    const transfer = await transfersService.create({ ...parsed.data, userId });
    res.status(201).json({ success: true, data: transfer });
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
  const parsed = updateTransferSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
    return;
  }
  try {
    const transfer = await transfersService.update(id, userId, parsed.data);
    res.json({ success: true, data: transfer });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    const status = message === 'Transferencia no encontrada' ? 404 : 500;
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
    await transfersService.remove(id, userId);
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    const status = message === 'Transferencia no encontrada' ? 404 : 500;
    res.status(status).json({ success: false, message });
  }
}
