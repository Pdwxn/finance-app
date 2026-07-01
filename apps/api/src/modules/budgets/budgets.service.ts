import * as budgetsRepository from './budgets.repository';

export function getAll(userId: string) {
  return budgetsRepository.findAll(userId);
}

export function getByPeriod(userId: string, period: string) {
  return budgetsRepository.findByPeriod(userId, period);
}

export function getById(id: string, userId: string) {
  return budgetsRepository.findById(id, userId);
}

export async function create(data: { id: string; categoryId: string; period: string; limitAmount: number; userId: string }) {
  const budget = await budgetsRepository.create({
    id: data.id,
    userId: data.userId,
    categoryId: data.categoryId,
    period: data.period,
    limitAmount: data.limitAmount,
  });
  if (!budget) throw new Error('Error al crear el presupuesto');
  return budget;
}

export async function update(id: string, userId: string, data: Record<string, unknown>) {
  const existing = await budgetsRepository.findById(id, userId);
  if (!existing) throw new Error('Presupuesto no encontrado');
  const budget = await budgetsRepository.update(id, userId, data);
  if (!budget) throw new Error('Error al actualizar el presupuesto');
  return budget;
}

export async function remove(id: string, userId: string) {
  const existing = await budgetsRepository.findById(id, userId);
  if (!existing) throw new Error('Presupuesto no encontrado');
  const budget = await budgetsRepository.softDelete(id, userId);
  if (!budget) throw new Error('Error al eliminar el presupuesto');
  return budget;
}
