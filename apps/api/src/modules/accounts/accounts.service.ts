import * as accountsRepository from './accounts.repository';

export function getAll(userId: string) {
  return accountsRepository.findAll(userId);
}

export function getById(id: string, userId: string) {
  return accountsRepository.findById(id, userId);
}

export async function create(data: { id: string; name: string; type: string; currency: string; initialBalance: number; userId: string }) {
  const account = await accountsRepository.create({
    id: data.id,
    userId: data.userId,
    name: data.name,
    type: data.type,
    currency: data.currency,
    initialBalance: data.initialBalance,
  });
  if (!account) throw new Error('Error al crear la cuenta');
  return account;
}

export async function update(id: string, userId: string, data: Record<string, unknown>) {
  const existing = await accountsRepository.findById(id, userId);
  if (!existing) throw new Error('Cuenta no encontrada');
  const account = await accountsRepository.update(id, userId, data);
  if (!account) throw new Error('Error al actualizar la cuenta');
  return account;
}

export async function remove(id: string, userId: string) {
  const existing = await accountsRepository.findById(id, userId);
  if (!existing) throw new Error('Cuenta no encontrada');
  const account = await accountsRepository.softDelete(id, userId);
  if (!account) throw new Error('Error al eliminar la cuenta');
  return account;
}
