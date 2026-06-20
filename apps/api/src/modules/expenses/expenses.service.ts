import * as expensesRepository from './expenses.repository';

export function getAll(userId: string) {
  return expensesRepository.findAll(userId);
}

export function getById(id: string, userId: string) {
  return expensesRepository.findById(id, userId);
}

export async function create(data: { id: string; accountId: string; categoryId: string; amount: number; description: string; transactionDate: string; userId: string }) {
  const expense = await expensesRepository.create({
    id: data.id,
    userId: data.userId,
    accountId: data.accountId,
    categoryId: data.categoryId,
    amount: data.amount,
    description: data.description,
    transactionDate: data.transactionDate,
  });
  if (!expense) throw new Error('Error al crear el gasto');
  return expense;
}

export async function update(id: string, userId: string, data: Record<string, unknown>) {
  const existing = await expensesRepository.findById(id, userId);
  if (!existing) throw new Error('Gasto no encontrado');
  const expense = await expensesRepository.update(id, userId, data);
  if (!expense) throw new Error('Error al actualizar el gasto');
  return expense;
}

export async function remove(id: string, userId: string) {
  const existing = await expensesRepository.findById(id, userId);
  if (!existing) throw new Error('Gasto no encontrado');
  const expense = await expensesRepository.softDelete(id, userId);
  if (!expense) throw new Error('Error al eliminar el gasto');
  return expense;
}
