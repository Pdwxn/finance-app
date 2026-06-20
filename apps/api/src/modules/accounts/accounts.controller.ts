import type { Request, Response } from 'express';
import * as accountsService from './accounts.service';
import { createAccountSchema, updateAccountSchema } from './accounts.schema';

export async function getAll(req: Request, res: Response) {
  const userId = req.user!.userId;
  const data = await accountsService.getAll(userId);
  res.json({ success: true, data });
}

export async function getById(req: Request, res: Response) {
  const userId = req.user!.userId;
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ success: false, message: 'ID no proporcionado' });
    return;
  }
  const account = await accountsService.getById(id, userId);
  if (!account) {
    res.status(404).json({ success: false, message: 'Cuenta no encontrada' });
    return;
  }
  res.json({ success: true, data: account });
}

export async function create(req: Request, res: Response) {
  const userId = req.user!.userId;
  const parsed = createAccountSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
    return;
  }
  try {
    const account = await accountsService.create({ ...parsed.data, userId });
    res.status(201).json({ success: true, data: account });
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
  const parsed = updateAccountSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
    return;
  }
  try {
    const account = await accountsService.update(id, userId, parsed.data);
    res.json({ success: true, data: account });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    const status = message === 'Cuenta no encontrada' ? 404 : 500;
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
    await accountsService.remove(id, userId);
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    const status = message === 'Cuenta no encontrada' ? 404 : 500;
    res.status(status).json({ success: false, message });
  }
}
