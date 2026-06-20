import * as creditCardsRepository from './credit-cards.repository';

export function getAll(userId: string) {
  return creditCardsRepository.findAll(userId);
}

export function getById(id: string, userId: string) {
  return creditCardsRepository.findById(id, userId);
}

export async function create(data: { id: string; name: string; limitAmount: number; closingDay: number; dueDay: number; userId: string }) {
  const card = await creditCardsRepository.create({
    id: data.id,
    userId: data.userId,
    name: data.name,
    limitAmount: data.limitAmount,
    closingDay: data.closingDay,
    dueDay: data.dueDay,
  });
  if (!card) throw new Error('Error al crear la tarjeta');
  return card;
}

export async function update(id: string, userId: string, data: Record<string, unknown>) {
  const existing = await creditCardsRepository.findById(id, userId);
  if (!existing) throw new Error('Tarjeta no encontrada');
  const card = await creditCardsRepository.update(id, userId, data);
  if (!card) throw new Error('Error al actualizar la tarjeta');
  return card;
}

export async function remove(id: string, userId: string) {
  const existing = await creditCardsRepository.findById(id, userId);
  if (!existing) throw new Error('Tarjeta no encontrada');
  const card = await creditCardsRepository.softDelete(id, userId);
  if (!card) throw new Error('Error al eliminar la tarjeta');
  return card;
}
