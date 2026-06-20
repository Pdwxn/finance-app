import * as cardPaymentsRepository from './card-payments.repository';

export function getAll() {
  return cardPaymentsRepository.findAll();
}

export function getById(id: string) {
  return cardPaymentsRepository.findById(id);
}

export async function create(data: { id: string; creditCardId: string; accountId: string; amount: number; paymentDate: string }) {
  const payment = await cardPaymentsRepository.create({
    id: data.id,
    creditCardId: data.creditCardId,
    accountId: data.accountId,
    amount: data.amount,
    paymentDate: data.paymentDate,
  });
  if (!payment) throw new Error('Error al crear el pago');
  return payment;
}

export async function update(id: string, data: Record<string, unknown>) {
  const existing = await cardPaymentsRepository.findById(id);
  if (!existing) throw new Error('Pago no encontrado');
  const payment = await cardPaymentsRepository.update(id, data);
  if (!payment) throw new Error('Error al actualizar el pago');
  return payment;
}

export async function remove(id: string) {
  const existing = await cardPaymentsRepository.findById(id);
  if (!existing) throw new Error('Pago no encontrado');
  const payment = await cardPaymentsRepository.softDelete(id);
  if (!payment) throw new Error('Error al eliminar el pago');
  return payment;
}
