import * as cardChargesRepository from './card-charges.repository';

export function getAll() {
  return cardChargesRepository.findAll();
}

export function getById(id: string) {
  return cardChargesRepository.findById(id);
}

export async function create(data: { id: string; creditCardId: string; categoryId: string; amount: number; description: string; transactionDate: string }) {
  const charge = await cardChargesRepository.create({
    id: data.id,
    creditCardId: data.creditCardId,
    categoryId: data.categoryId,
    amount: data.amount,
    description: data.description,
    transactionDate: data.transactionDate,
  });
  if (!charge) throw new Error('Error al crear el cargo');
  return charge;
}

export async function update(id: string, data: Record<string, unknown>) {
  const existing = await cardChargesRepository.findById(id);
  if (!existing) throw new Error('Cargo no encontrado');
  const charge = await cardChargesRepository.update(id, data);
  if (!charge) throw new Error('Error al actualizar el cargo');
  return charge;
}

export async function remove(id: string) {
  const existing = await cardChargesRepository.findById(id);
  if (!existing) throw new Error('Cargo no encontrado');
  const charge = await cardChargesRepository.softDelete(id);
  if (!charge) throw new Error('Error al eliminar el cargo');
  return charge;
}
