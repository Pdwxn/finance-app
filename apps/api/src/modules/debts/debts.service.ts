import * as debtsRepository from './debts.repository';

export function getAll(userId: string) {
  return debtsRepository.findAll(userId);
}

export function getById(id: string, userId: string) {
  return debtsRepository.findById(id, userId);
}

export async function create(data: { id: string; name: string; initialAmount: number; interestRate: number; startDate: string; userId: string }) {
  const debt = await debtsRepository.create({
    id: data.id,
    userId: data.userId,
    name: data.name,
    initialAmount: data.initialAmount,
    interestRate: data.interestRate.toString(),
    startDate: data.startDate,
  });
  if (!debt) throw new Error('Error al crear la deuda');
  return debt;
}

export async function update(id: string, userId: string, data: Record<string, unknown>) {
  const existing = await debtsRepository.findById(id, userId);
  if (!existing) throw new Error('Deuda no encontrada');
  const debt = await debtsRepository.update(id, userId, data);
  if (!debt) throw new Error('Error al actualizar la deuda');
  return debt;
}

export async function remove(id: string, userId: string) {
  const existing = await debtsRepository.findById(id, userId);
  if (!existing) throw new Error('Deuda no encontrada');
  const debt = await debtsRepository.softDelete(id, userId);
  if (!debt) throw new Error('Error al eliminar la deuda');
  return debt;
}
