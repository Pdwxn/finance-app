import * as categoriesRepository from './categories.repository';

export function getAll(userId: string) {
  return categoriesRepository.findAll(userId);
}

export function getById(id: string, userId: string) {
  return categoriesRepository.findById(id, userId);
}

export async function create(data: { id: string; name: string; type: string; icon: string; color: string; userId: string }) {
  const category = await categoriesRepository.create({
    id: data.id,
    userId: data.userId,
    name: data.name,
    type: data.type,
    icon: data.icon,
    color: data.color,
  });
  if (!category) throw new Error('Error al crear la categoría');
  return category;
}

export async function update(id: string, userId: string, data: Record<string, unknown>) {
  const existing = await categoriesRepository.findById(id, userId);
  if (!existing) throw new Error('Categoría no encontrada');
  const category = await categoriesRepository.update(id, userId, data);
  if (!category) throw new Error('Error al actualizar la categoría');
  return category;
}

export async function remove(id: string, userId: string) {
  const existing = await categoriesRepository.findById(id, userId);
  if (!existing) throw new Error('Categoría no encontrada');
  const category = await categoriesRepository.softDelete(id, userId);
  if (!category) throw new Error('Error al eliminar la categoría');
  return category;
}
