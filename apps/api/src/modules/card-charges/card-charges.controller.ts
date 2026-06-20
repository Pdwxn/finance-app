import type { Request, Response } from 'express';
import * as cardChargesService from './card-charges.service';
import { createCardChargeSchema, updateCardChargeSchema } from './card-charges.schema';

export async function getAll(_req: Request, res: Response) {
  const data = await cardChargesService.getAll();
  res.json({ success: true, data });
}

export async function getById(req: Request, res: Response) {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ success: false, message: 'ID no proporcionado' });
    return;
  }
  const charge = await cardChargesService.getById(id);
  if (!charge) {
    res.status(404).json({ success: false, message: 'Cargo no encontrado' });
    return;
  }
  res.json({ success: true, data: charge });
}

export async function create(req: Request, res: Response) {
  const parsed = createCardChargeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
    return;
  }
  try {
    const charge = await cardChargesService.create(parsed.data);
    res.status(201).json({ success: true, data: charge });
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
  const parsed = updateCardChargeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
    return;
  }
  try {
    const charge = await cardChargesService.update(id, parsed.data);
    res.json({ success: true, data: charge });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    const status = message === 'Cargo no encontrado' ? 404 : 500;
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
    await cardChargesService.remove(id);
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    const status = message === 'Cargo no encontrado' ? 404 : 500;
    res.status(status).json({ success: false, message });
  }
}
