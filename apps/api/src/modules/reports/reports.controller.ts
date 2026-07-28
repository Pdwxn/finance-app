import type { Request, Response } from 'express';
import * as reportsService from './reports.service';
import { listReportsSchema, generateReportSchema } from './reports.schema';

export async function getAll(req: Request, res: Response) {
  const userId = req.user!.userId;
  const parsed = listReportsSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
    return;
  }
  const { type, page, limit } = parsed.data;
  const data = await reportsService.getAll(userId, type, page, limit);
  res.json({ success: true, data });
}

export async function getById(req: Request, res: Response) {
  const userId = req.user!.userId;
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ success: false, message: 'ID no proporcionado' });
    return;
  }
  const report = await reportsService.getById(id, userId);
  if (!report) {
    res.status(404).json({ success: false, message: 'Reporte no encontrado' });
    return;
  }
  res.json({ success: true, data: report });
}

export async function remove(req: Request, res: Response) {
  const userId = req.user!.userId;
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ success: false, message: 'ID no proporcionado' });
    return;
  }
  try {
    await reportsService.remove(id, userId);
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    const status = message === 'Reporte no encontrado' ? 404 : 500;
    res.status(status).json({ success: false, message });
  }
}

export async function generate(req: Request, res: Response) {
  const userId = req.user!.userId;
  const parsed = generateReportSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
    return;
  }
  try {
    await reportsService.generate(userId, parsed.data.type);
    res.json({ success: true, message: 'Reporte generado correctamente' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    res.status(500).json({ success: false, message });
  }
}

export async function getUnreadCount(req: Request, res: Response) {
  const userId = req.user!.userId;
  const count = await reportsService.getUnreadCount(userId);
  res.json({ success: true, data: { count } });
}
