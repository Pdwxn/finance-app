import * as debtPaymentsRepository from './debt-payments.repository';

export function getAll() {
  return debtPaymentsRepository.findAll();
}

export function getById(id: string) {
  return debtPaymentsRepository.findById(id);
}

export async function create(data: { id: string; debtId: string; amount: number; paymentDate: string }) {
  const payment = await debtPaymentsRepository.create({
    id: data.id,
    debtId: data.debtId,
    amount: data.amount,
    paymentDate: data.paymentDate,
  });
  if (!payment) throw new Error('Error al crear el pago');
  return payment;
}

export async function update(id: string, data: Record<string, unknown>) {
  const existing = await debtPaymentsRepository.findById(id);
  if (!existing) throw new Error('Pago no encontrado');
  const payment = await debtPaymentsRepository.update(id, data);
  if (!payment) throw new Error('Error al actualizar el pago');
  return payment;
}

export async function remove(id: string) {
  const existing = await debtPaymentsRepository.findById(id);
  if (!existing) throw new Error('Pago no encontrado');
  const payment = await debtPaymentsRepository.softDelete(id);
  if (!payment) throw new Error('Error al eliminar el pago');
  return payment;
}
