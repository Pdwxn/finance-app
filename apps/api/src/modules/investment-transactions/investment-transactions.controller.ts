import type { Request, Response } from 'express';
import * as investmentTransactionsService from './investment-transactions.service';
import { createInvestmentTransactionSchema, updateInvestmentTransactionSchema } from './investment-transactions.schema';

export async function getAll(_req: Request, res: Response) {
  const data = await investmentTransactionsService.getAll();
  res.json({ success: true, data });
}

export async function getById(req: Request, res: Response) {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ success: false, message: 'ID no proporcionado' });
    return;
  }
  const transaction = await investmentTransactionsService.getById(id);
  if (!transaction) {
    res.status(404).json({ success: false, message: 'Transacción no encontrada' });
    return;
  }
  res.json({ success: true, data: transaction });
}

export async function create(req: Request, res: Response) {
  const parsed = createInvestmentTransactionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
    return;
  }
  try {
    const transaction = await investmentTransactionsService.create(parsed.data);
    res.status(201).json({ success: true, data: transaction });
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
  const parsed = updateInvestmentTransactionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
    return;
  }
  try {
    const transaction = await investmentTransactionsService.update(id, parsed.data);
    res.json({ success: true, data: transaction });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    const status = message === 'Transacción no encontrada' ? 404 : 500;
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
    await investmentTransactionsService.remove(id);
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    const status = message === 'Transacción no encontrada' ? 404 : 500;
    res.status(status).json({ success: false, message });
  }
}
