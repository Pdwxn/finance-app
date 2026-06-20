import * as transfersRepository from './transfers.repository';

export function getAll(userId: string) {
  return transfersRepository.findAll(userId);
}

export function getById(id: string, userId: string) {
  return transfersRepository.findById(id, userId);
}

export async function create(data: { id: string; fromAccountId: string; toAccountId: string; amount: number; description: string; transactionDate: string; userId: string }) {
  const transfer = await transfersRepository.create({
    id: data.id,
    userId: data.userId,
    fromAccountId: data.fromAccountId,
    toAccountId: data.toAccountId,
    amount: data.amount,
    description: data.description,
    transactionDate: data.transactionDate,
  });
  if (!transfer) throw new Error('Error al crear la transferencia');
  return transfer;
}

export async function update(id: string, userId: string, data: Record<string, unknown>) {
  const existing = await transfersRepository.findById(id, userId);
  if (!existing) throw new Error('Transferencia no encontrada');
  const transfer = await transfersRepository.update(id, userId, data);
  if (!transfer) throw new Error('Error al actualizar la transferencia');
  return transfer;
}

export async function remove(id: string, userId: string) {
  const existing = await transfersRepository.findById(id, userId);
  if (!existing) throw new Error('Transferencia no encontrada');
  const transfer = await transfersRepository.softDelete(id, userId);
  if (!transfer) throw new Error('Error al eliminar la transferencia');
  return transfer;
}
