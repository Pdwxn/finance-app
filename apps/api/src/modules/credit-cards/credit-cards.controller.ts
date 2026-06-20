import type { Request, Response } from 'express';
import * as creditCardsService from './credit-cards.service';
import { createCreditCardSchema, updateCreditCardSchema } from './credit-cards.schema';

export async function getAll(req: Request, res: Response) {
  const userId = req.user!.userId;
  const data = await creditCardsService.getAll(userId);
  res.json({ success: true, data });
}

export async function getById(req: Request, res: Response) {
  const userId = req.user!.userId;
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ success: false, message: 'ID no proporcionado' });
    return;
  }
  const card = await creditCardsService.getById(id, userId);
  if (!card) {
    res.status(404).json({ success: false, message: 'Tarjeta no encontrada' });
    return;
  }
  res.json({ success: true, data: card });
}

export async function create(req: Request, res: Response) {
  const userId = req.user!.userId;
  const parsed = createCreditCardSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
    return;
  }
  try {
    const card = await creditCardsService.create({ ...parsed.data, userId });
    res.status(201).json({ success: true, data: card });
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
  const parsed = updateCreditCardSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
    return;
  }
  try {
    const card = await creditCardsService.update(id, userId, parsed.data);
    res.json({ success: true, data: card });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    const status = message === 'Tarjeta no encontrada' ? 404 : 500;
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
    await creditCardsService.remove(id, userId);
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    const status = message === 'Tarjeta no encontrada' ? 404 : 500;
    res.status(status).json({ success: false, message });
  }
}
