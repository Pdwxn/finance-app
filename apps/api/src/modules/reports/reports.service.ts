import * as reportsRepository from './reports.repository';
import { generateWeeklyReport, generateMonthlyReport } from '../../services/report-generator';

export function getAll(userId: string, type?: string, page = 1, limit = 20) {
  return reportsRepository.findAll(userId, type, page, limit);
}

export function getById(id: string, userId: string) {
  return reportsRepository.findById(id, userId);
}

export function getUnreadCount(userId: string) {
  return reportsRepository.countUnread(userId);
}

export async function remove(id: string, userId: string) {
  const existing = await reportsRepository.findById(id, userId);
  if (!existing) throw new Error('Reporte no encontrado');
  await reportsRepository.softDelete(id, userId);
}

export async function generate(userId: string, type: 'weekly' | 'monthly') {
  if (type === 'weekly') {
    await generateWeeklyReport(userId);
  } else {
    await generateMonthlyReport(userId);
  }
}
