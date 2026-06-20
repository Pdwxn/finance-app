import * as investmentTransactionsRepository from './investment-transactions.repository';

export function getAll() {
  return investmentTransactionsRepository.findAll();
}

export function getById(id: string) {
  return investmentTransactionsRepository.findById(id);
}

export async function create(data: { id: string; investmentId: string; type: string; quantity: number; price: number; transactionDate: string }) {
  const transaction = await investmentTransactionsRepository.create({
    id: data.id,
    investmentId: data.investmentId,
    type: data.type,
    quantity: data.quantity.toString(),
    price: data.price,
    transactionDate: data.transactionDate,
  });
  if (!transaction) throw new Error('Error al crear la transacción');
  return transaction;
}

export async function update(id: string, data: Record<string, unknown>) {
  const existing = await investmentTransactionsRepository.findById(id);
  if (!existing) throw new Error('Transacción no encontrada');
  const transaction = await investmentTransactionsRepository.update(id, data);
  if (!transaction) throw new Error('Error al actualizar la transacción');
  return transaction;
}

export async function remove(id: string) {
  const existing = await investmentTransactionsRepository.findById(id);
  if (!existing) throw new Error('Transacción no encontrada');
  const transaction = await investmentTransactionsRepository.softDelete(id);
  if (!transaction) throw new Error('Error al eliminar la transacción');
  return transaction;
}
