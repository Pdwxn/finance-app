import * as cardChargesRepository from './card-charges.repository';
import { cardCharges } from '../../db/schema/card-charges';

type CreateData = typeof cardCharges.$inferInsert;

export function getAll() {
  return cardChargesRepository.findAll();
}

export function getById(id: string) {
  return cardChargesRepository.findById(id);
}

export async function create(data: CreateData) {
  const charge = await cardChargesRepository.create(data);
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
