import type { Request, Response } from 'express';
import * as authService from './auth.service';
import { registerSchema, loginSchema, refreshSchema } from './auth.schema';

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
    return;
  }

  try {
    const result = await authService.register(parsed.data);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    res.status(409).json({ success: false, message });
  }
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
    return;
  }

  try {
    const result = await authService.login(parsed.data);
    res.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    res.status(401).json({ success: false, message });
  }
}

export async function refresh(req: Request, res: Response) {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
    return;
  }

  try {
    const result = await authService.refresh(parsed.data.refreshToken);
    res.json({ success: true, data: result });
  } catch {
    res.status(401).json({ success: false, message: 'Refresh token inválido o expirado' });
  }
}
