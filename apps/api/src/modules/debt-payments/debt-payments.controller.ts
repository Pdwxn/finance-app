import type { Request, Response } from 'express';
import * as debtPaymentsService from './debt-payments.service';
import { createDebtPaymentSchema, updateDebtPaymentSchema } from './debt-payments.schema';

export async function getAll(_req: Request, res: Response) {
  const data = await debtPaymentsService.getAll();
  res.json({ success: true, data });
}

export async function getById(req: Request, res: Response) {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ success: false, message: 'ID no proporcionado' });
    return;
  }
  const payment = await debtPaymentsService.getById(id);
  if (!payment) {
    res.status(404).json({ success: false, message: 'Pago no encontrado' });
    return;
  }
  res.json({ success: true, data: payment });
}

export async function create(req: Request, res: Response) {
  const parsed = createDebtPaymentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
    return;
  }
  try {
    const payment = await debtPaymentsService.create(parsed.data);
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
  const parsed = updateDebtPaymentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
    return;
  }
  try {
    const payment = await debtPaymentsService.update(id, parsed.data);
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
    await debtPaymentsService.remove(id);
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    const status = message === 'Pago no encontrado' ? 404 : 500;
    res.status(status).json({ success: false, message });
  }
}
