import * as incomesRepository from './incomes.repository';

export function getAll(userId: string) {
  return incomesRepository.findAll(userId);
}

export function getById(id: string, userId: string) {
  return incomesRepository.findById(id, userId);
}

export async function create(data: { id: string; accountId: string; categoryId: string; amount: number; description: string; transactionDate: string; userId: string }) {
  const income = await incomesRepository.create({
    id: data.id,
    userId: data.userId,
    accountId: data.accountId,
    categoryId: data.categoryId,
    amount: data.amount,
    description: data.description,
    transactionDate: data.transactionDate,
  });
  if (!income) throw new Error('Error al crear el ingreso');
  return income;
}

export async function update(id: string, userId: string, data: Record<string, unknown>) {
  const existing = await incomesRepository.findById(id, userId);
  if (!existing) throw new Error('Ingreso no encontrado');
  const income = await incomesRepository.update(id, userId, data);
  if (!income) throw new Error('Error al actualizar el ingreso');
  return income;
}

export async function remove(id: string, userId: string) {
  const existing = await incomesRepository.findById(id, userId);
  if (!existing) throw new Error('Ingreso no encontrado');
  const income = await incomesRepository.softDelete(id, userId);
  if (!income) throw new Error('Error al eliminar el ingreso');
  return income;
}
