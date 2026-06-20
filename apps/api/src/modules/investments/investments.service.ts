import * as investmentsRepository from './investments.repository';

export function getAll(userId: string) {
  return investmentsRepository.findAll(userId);
}

export function getById(id: string, userId: string) {
  return investmentsRepository.findById(id, userId);
}

export async function create(data: { id: string; symbol: string; name: string; quantity: number; averageCost: number; userId: string }) {
  const investment = await investmentsRepository.create({
    id: data.id,
    userId: data.userId,
    symbol: data.symbol,
    name: data.name,
    quantity: data.quantity.toString(),
    averageCost: data.averageCost,
  });
  if (!investment) throw new Error('Error al crear la inversión');
  return investment;
}

export async function update(id: string, userId: string, data: Record<string, unknown>) {
  const existing = await investmentsRepository.findById(id, userId);
  if (!existing) throw new Error('Inversión no encontrada');
  const investment = await investmentsRepository.update(id, userId, data);
  if (!investment) throw new Error('Error al actualizar la inversión');
  return investment;
}

export async function remove(id: string, userId: string) {
  const existing = await investmentsRepository.findById(id, userId);
  if (!existing) throw new Error('Inversión no encontrada');
  const investment = await investmentsRepository.softDelete(id, userId);
  if (!investment) throw new Error('Error al eliminar la inversión');
  return investment;
}
