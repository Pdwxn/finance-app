import * as goalContributionsRepository from './goal-contributions.repository';

export function getAll() {
  return goalContributionsRepository.findAll();
}

export function getById(id: string) {
  return goalContributionsRepository.findById(id);
}

export async function create(data: { id: string; goalId: string; accountId: string; amount: number; contributionDate: string }) {
  const contribution = await goalContributionsRepository.create({
    id: data.id,
    goalId: data.goalId,
    accountId: data.accountId,
    amount: data.amount,
    contributionDate: data.contributionDate,
  });
  if (!contribution) throw new Error('Error al crear la contribución');
  return contribution;
}

export async function update(id: string, data: Record<string, unknown>) {
  const existing = await goalContributionsRepository.findById(id);
  if (!existing) throw new Error('Contribución no encontrada');
  const contribution = await goalContributionsRepository.update(id, data);
  if (!contribution) throw new Error('Error al actualizar la contribución');
  return contribution;
}

export async function remove(id: string) {
  const existing = await goalContributionsRepository.findById(id);
  if (!existing) throw new Error('Contribución no encontrada');
  const contribution = await goalContributionsRepository.softDelete(id);
  if (!contribution) throw new Error('Error al eliminar la contribución');
  return contribution;
}
