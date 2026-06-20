import * as goalsRepository from './goals.repository';

export function getAll(userId: string) {
  return goalsRepository.findAll(userId);
}

export function getById(id: string, userId: string) {
  return goalsRepository.findById(id, userId);
}

export async function create(data: { id: string; name: string; targetAmount: number; targetDate: string; userId: string }) {
  const goal = await goalsRepository.create({
    id: data.id,
    userId: data.userId,
    name: data.name,
    targetAmount: data.targetAmount,
    targetDate: data.targetDate,
  });
  if (!goal) throw new Error('Error al crear la meta');
  return goal;
}

export async function update(id: string, userId: string, data: Record<string, unknown>) {
  const existing = await goalsRepository.findById(id, userId);
  if (!existing) throw new Error('Meta no encontrada');
  const goal = await goalsRepository.update(id, userId, data);
  if (!goal) throw new Error('Error al actualizar la meta');
  return goal;
}

export async function remove(id: string, userId: string) {
  const existing = await goalsRepository.findById(id, userId);
  if (!existing) throw new Error('Meta no encontrada');
  const goal = await goalsRepository.softDelete(id, userId);
  if (!goal) throw new Error('Error al eliminar la meta');
  return goal;
}
