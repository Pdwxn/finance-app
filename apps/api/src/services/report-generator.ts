import { randomUUID } from 'crypto';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../config/db';
import { financialReports } from '../db/schema/financial-reports';
import { generateSummary } from './groq';
import { aggregatePeriod } from './report-aggregator';
import type { AggregatedData } from './report-aggregator';

export interface CategorySummary {
  categoryId: string;
  name: string;
  amount: number;
  percentage: number;
}

export interface ReportMetadata {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  incomeByCategory: CategorySummary[];
  expenseByCategory: CategorySummary[];
  comparisonPrevious?: {
    incomeChange: number;
    expensesChange: number;
    balanceChange: number;
  };
  budgetsAtRisk: Array<{ categoryId: string; name: string; used: number; limit: number }>;
  topExpenses: Array<{ description: string; amount: number; category: string }>;
  currency: string;
}

function getWeekRange(date: Date): { start: string; end: string } {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date);
  monday.setDate(diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };

  return { start: fmt(monday), end: fmt(sunday) };
}

function getPreviousWeekRange(date: Date): { start: string; end: string } {
  const prev = new Date(date);
  prev.setDate(prev.getDate() - 7);
  return getWeekRange(prev);
}

function getMonthRange(date: Date): { start: string; end: string } {
  const year = date.getFullYear();
  const month = date.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const fmt = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };
  return {
    start: fmt(new Date(year, month, 1)),
    end: fmt(new Date(year, month, lastDay)),
  };
}

function getPreviousMonthRange(date: Date): { start: string; end: string } {
  const prev = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  return getMonthRange(prev);
}

function formatCents(cents: number, currency: string): string {
  const symbols: Record<string, string> = { CLP: '$', USD: '$', EUR: '€', ARS: '$', COP: '$', MXN: '$', PEN: 'S/', UYU: '$' };
  const symbol = symbols[currency] ?? currency;
  const value = (cents / 100).toLocaleString(currency === 'CLP' ? 'es-CL' : 'es-ES', {
    minimumFractionDigits: currency === 'CLP' ? 0 : 2,
    maximumFractionDigits: currency === 'CLP' ? 0 : 2,
  });
  return `${symbol}${value}`;
}

function formatPercentage(change: number): string {
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
}

function buildCategoryList(items: CategorySummary[], currency: string): string {
  return items
    .map(c => `  - ${c.name}: ${formatCents(c.amount, currency)} (${c.percentage}%)`)
    .join('\n');
}

function buildWeeklyPrompt(
  data: AggregatedData,
  prev: AggregatedData | undefined,
  startDate: string,
  endDate: string,
): string {
  const { currency } = data;

  let comparisonSection = '';
  if (prev && prev.totalIncome > 0 && prev.totalExpenses > 0) {
    const incomeChange = ((data.totalIncome - prev.totalIncome) / prev.totalIncome) * 100;
    const expensesChange = ((data.totalExpenses - prev.totalExpenses) / prev.totalExpenses) * 100;
    const prevBalance = prev.totalIncome - prev.totalExpenses;
    const currentBalance = data.totalIncome - data.totalExpenses;
    const balanceChange = prevBalance !== 0
      ? ((currentBalance - prevBalance) / Math.abs(prevBalance)) * 100
      : 0;

    comparisonSection = `COMPARATIVA CON SEMANA ANTERIOR:\n- Ingresos: ${formatPercentage(incomeChange)}\n- Gastos: ${formatPercentage(expensesChange)}\n- Balance: ${formatPercentage(balanceChange)}\n`;
    data.comparisonPrevious = { incomeChange, expensesChange, balanceChange };
  }

  let budgetsSection = '';
  if (data.budgetsAtRisk.length > 0) {
    budgetsSection = 'PRESUPUESTOS EN RIESGO:\n' + data.budgetsAtRisk
      .map(b => `  - ${b.name}: ${formatCents(b.used, currency)} de ${formatCents(b.limit, currency)} (${Math.round((b.used / b.limit) * 100)}%)`)
      .join('\n') + '\n';
  }

  const incomeList = buildCategoryList(data.incomeByCategory, currency);
  const expenseList = buildCategoryList(data.expenseByCategory, currency);

  return `Eres el asistente financiero de Numa, una app de finanzas personales.
Genera un resumen financiero semanal conciso en español.

PERÍODO: ${startDate} - ${endDate}

DATOS:
- Ingresos totales: ${formatCents(data.totalIncome, currency)}
- Gastos totales: ${formatCents(data.totalExpenses, currency)}
- Balance neto: ${formatCents(data.netBalance, currency)}

GASTOS POR CATEGORÍA:
${expenseList}

INGRESOS POR CATEGORÍA:
${incomeList}

${comparisonSection}${budgetsSection}
INSTRUCCIONES:
1. Resume el período en 2-3 oraciones
2. Menciona las 2-3 categorías más relevantes de gasto
3. ${comparisonSection ? 'Menciona la tendencia respecto a la semana anterior (subió/bajó)' : 'Comenta el balance general del período'}
4. Si hay presupuestos en riesgo, advierte amablemente
5. Da 1 sugerencia financiera concreta y accionable
6. Sé directo y usa tono amigable
7. Máximo 150 palabras

RESPUESTO (solo el resumen, sin títulos ni formato markdown):`;
}

function buildMonthlyPrompt(
  data: AggregatedData,
  prev: AggregatedData | undefined,
  startDate: string,
  endDate: string,
): string {
  const { currency } = data;

  const savingsRate = data.totalIncome > 0
    ? Math.round((data.netBalance / data.totalIncome) * 100)
    : 0;

  let comparisonSection = '';
  if (prev && prev.totalIncome > 0 && prev.totalExpenses > 0) {
    const incomeChange = ((data.totalIncome - prev.totalIncome) / prev.totalIncome) * 100;
    const expensesChange = ((data.totalExpenses - prev.totalExpenses) / prev.totalExpenses) * 100;
    const prevBalance = prev.totalIncome - prev.totalExpenses;
    const currentBalance = data.totalIncome - data.totalExpenses;
    const balanceChange = prevBalance !== 0
      ? ((currentBalance - prevBalance) / Math.abs(prevBalance)) * 100
      : 0;

    comparisonSection = `COMPARATIVA CON MES ANTERIOR:\n- Ingresos: ${formatPercentage(incomeChange)}\n- Gastos: ${formatPercentage(expensesChange)}\n- Balance: ${formatPercentage(balanceChange)}\n`;
    data.comparisonPrevious = { incomeChange, expensesChange, balanceChange };
  }

  let budgetsSection = '';
  if (data.budgetsAtRisk.length > 0) {
    budgetsSection = 'PRESUPUESTOS EN RIESGO:\n' + data.budgetsAtRisk
      .map(b => `  - ${b.name}: ${formatCents(b.used, currency)} de ${formatCents(b.limit, currency)} (${Math.round((b.used / b.limit) * 100)}%)`)
      .join('\n') + '\n';
  }

  const incomeList = buildCategoryList(data.incomeByCategory, currency);
  const expenseList = buildCategoryList(data.expenseByCategory, currency);
  const topExpenses = data.topExpenses.map(e => `  - ${e.description}: ${formatCents(e.amount, currency)} (${e.category})`).join('\n');

  return `Eres el asistente financiero de Numa, una app de finanzas personales.
Genera un resumen financiero mensual detallado en español.

PERÍODO: ${startDate} - ${endDate}

DATOS GENERALES:
- Ingresos totales: ${formatCents(data.totalIncome, currency)}
- Gastos totales: ${formatCents(data.totalExpenses, currency)}
- Balance neto: ${formatCents(data.netBalance, currency)}
- Tasa de ahorro: ${savingsRate}%

DESGLOSE POR CATEGORÍA:
GASTOS:
${expenseList}

INGRESOS:
${incomeList}

${comparisonSection}${budgetsSection}
TOP 5 GASTOS MÁS ALTOS:
${topExpenses}

INSTRUCCIONES:
1. Resumen general del mes (2-3 oraciones)
2. Análisis de las principales categorías de gasto
3. ${comparisonSection ? 'Comparativa con el mes anterior (tendencias claras)' : 'Estado financiero general del mes'}
4. Estado de presupuestos (si hay alertas)
5. Patrón de gasto observado
6. 2-3 sugerencias financieras concretas y accionables
7. Tono positivo y motivacional
8. Máximo 250 palabras

RESPUESTO (solo el resumen, sin títulos ni formato markdown):`;
}

export async function generateWeeklyReport(userId: string): Promise<void> {
  const now = new Date();
  const { start, end } = getWeekRange(now);
  const prevRange = getPreviousWeekRange(now);

  const existing = await db
    .select()
    .from(financialReports)
    .where(and(
      eq(financialReports.userId, userId),
      eq(financialReports.type, 'weekly'),
      eq(financialReports.periodStart, start),
      isNull(financialReports.deletedAt),
    ))
    .limit(1);

  if (existing.length > 0) return;

  const { current, comparison } = await aggregatePeriod(userId, start, end, prevRange.start, prevRange.end);

  const prompt = buildWeeklyPrompt(current, comparison, start, end);
  const summary = await generateSummary(prompt);

  const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const startDate = new Date(start + 'T12:00:00');
  const endDate = new Date(end + 'T12:00:00');
  const title = `Resumen semanal: ${startDate.getDate()} de ${monthNames[startDate.getMonth()]} - ${endDate.getDate()} de ${monthNames[endDate.getMonth()]}`;

  await db.insert(financialReports).values({
    id: randomUUID(),
    userId,
    type: 'weekly',
    periodStart: start,
    periodEnd: end,
    title,
    summary,
    metadata: current as unknown as Record<string, unknown>,
  });
}

export async function generateMonthlyReport(userId: string): Promise<void> {
  const now = new Date();
  const { start, end } = getMonthRange(now);
  const prevRange = getPreviousMonthRange(now);

  const existing = await db
    .select()
    .from(financialReports)
    .where(and(
      eq(financialReports.userId, userId),
      eq(financialReports.type, 'monthly'),
      eq(financialReports.periodStart, start),
      isNull(financialReports.deletedAt),
    ))
    .limit(1);

  if (existing.length > 0) return;

  const { current, comparison } = await aggregatePeriod(userId, start, end, prevRange.start, prevRange.end);

  const prompt = buildMonthlyPrompt(current, comparison, start, end);
  const summary = await generateSummary(prompt);

  const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const startDate = new Date(start + 'T12:00:00');
  const title = `Resumen mensual: ${monthNames[startDate.getMonth()]} ${startDate.getFullYear()}`;

  await db.insert(financialReports).values({
    id: randomUUID(),
    userId,
    type: 'monthly',
    periodStart: start,
    periodEnd: end,
    title,
    summary,
    metadata: current as unknown as Record<string, unknown>,
  });
}
