import { v4 as uuidv4 } from 'uuid';

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export function formatCLP(cents: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(fromCents(cents));
}

export function formatDate(date: string): string {
  const [year = 0, month = 0, day = 0] = date.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d);
}

export function generateUUID(): string {
  return uuidv4();
}

// ─── Credit Card Installments ────────────────────────────────────────────────

/**
 * Calcula el monto de cada cuota (Sistema Francés para interés compuesto).
 * Sin interés: amount / n.
 * Con interés: P * [i(1+i)^n] / [(1+i)^n - 1], i = rate/100.
 */
export function calculateInstallment(
  amount: number,
  rate: number | null,
  n: number,
): number {
  if (!rate || rate === 0) {
    return Math.round(amount / n);
  }
  const i = rate / 100;
  const factor = (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
  return Math.round(amount * factor);
}

/**
 * Genera los montos individuales para N cuotas.
 * La última cuota absorbe el redondeo (solo sin interés).
 */
export function generateInstallments(
  amount: number,
  rate: number | null,
  n: number,
): number[] {
  const installmentAmount = calculateInstallment(amount, rate, n);

  if (rate && rate > 0) {
    return Array(n).fill(installmentAmount);
  }
  const last = amount - installmentAmount * (n - 1);
  return [...Array(n - 1).fill(installmentAmount), last];
}

// ─── Statement Period ────────────────────────────────────────────────────────

export interface StatementPeriod {
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  duePeriod: string;
  label: string;
}

export function getStatementPeriod(
  date: string | Date,
  closingDay: number,
  dueDay: number,
): StatementPeriod {
  const d = typeof date === 'string' ? new Date(date + 'T12:00:00') : new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();

  let periodStart: Date;
  let periodEnd: Date;
  let dueDate: Date;

  if (day >= closingDay) {
    periodStart = new Date(year, month, closingDay);
    periodEnd = new Date(year, month + 1, closingDay - 1);
    dueDate = new Date(year, month + 1, dueDay);
  } else {
    periodStart = new Date(year, month - 1, closingDay);
    periodEnd = new Date(year, month, closingDay - 1);
    dueDate = new Date(year, month, dueDay);
  }

  return {
    periodStart: fmtDate(periodStart),
    periodEnd: fmtDate(periodEnd),
    dueDate: fmtDate(dueDate),
    duePeriod: getPeriodYYYYMM(periodEnd),
    label: getMonthLabel(periodEnd),
  };
}

function fmtDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function getMonthLabel(d: Date): string {
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function getPeriodYYYYMM(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date + 'T12:00:00') : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
