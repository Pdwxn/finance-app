import type { Request, Response } from 'express';
import * as cardPaymentsService from './card-payments.service';
import { createCardPaymentSchema, updateCardPaymentSchema } from './card-payments.schema';

export async function getAll(_req: Request, res: Response) {
  const data = await cardPaymentsService.getAll();
  res.json({ success: true, data });
}

export async function getById(req: Request, res: Response) {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ success: false, message: 'ID no proporcionado' });
    return;
  }
  const payment = await cardPaymentsService.getById(id);
  if (!payment) {
    res.status(404).json({ success: false, message: 'Pago no encontrado' });
    return;
  }
  res.json({ success: true, data: payment });
}

export async function create(req: Request, res: Response) {
  const parsed = createCardPaymentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
    return;
  }
  try {
    const payment = await cardPaymentsService.create(parsed.data);
    res.status(201).json({ success: true, data: payment });
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
  const parsed = updateCardPaymentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
    return;
  }
  try {
    const payment = await cardPaymentsService.update(id, parsed.data);
    res.json({ success: true, data: payment });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    const status = message === 'Pago no encontrado' ? 404 : 500;
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
    await cardPaymentsService.remove(id);
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    const status = message === 'Pago no encontrado' ? 404 : 500;
    res.status(status).json({ success: false, message });
  }
}
