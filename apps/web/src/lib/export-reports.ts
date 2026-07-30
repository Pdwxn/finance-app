import { fromCents, getCurrencySymbol } from '@finance-app/utils';
import { saveAs } from 'file-saver';

export interface CashflowRow {
  month: string;
  income: number;
  expense: number;
}

export interface SpendingByCategoryRow {
  name: string;
  amount: number;
}

export interface MovementRow {
  date: string;
  type: string;
  category: string;
  description: string;
  account: string;
  amount: number;
}

export interface ReportData {
  cashflowData: CashflowRow[];
  spendingByCategory: SpendingByCategoryRow[];
  totalIncome: number;
  totalExpense: number;
  netWorth: number;
  currency: string;
  currentMonthMovements: MovementRow[];
}

export async function exportMonthlyReport(data: ReportData): Promise<void> {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Numa';
  workbook.created = new Date();

  const currencySymbol = getCurrencySymbol(data.currency);
  const numFmt = data.currency === 'CLP' ? '#,##0' : '#,##0.00';

  // ── Hoja 1: Patrimonio Neto ──────────────────────────────────────────────
  const summarySheet = workbook.addWorksheet('Patrimonio Neto');
  summarySheet.columns = [
    { header: 'Concepto', key: 'concept', width: 30 },
    { header: 'Monto', key: 'amount', width: 20 },
  ];

  const totalCashflow = data.totalIncome - data.totalExpense;

  const summaryRows = [
    { concept: 'Ingresos totales', amount: fromCents(data.totalIncome) },
    { concept: 'Gastos totales', amount: fromCents(data.totalExpense) },
    { concept: 'Flujo neto (ingresos - gastos)', amount: fromCents(totalCashflow) },
    { concept: 'Patrimonio neto', amount: fromCents(data.netWorth) },
  ];

  for (const row of summaryRows) {
    summarySheet.addRow(row);
  }

  styleSheet(summarySheet, numFmt);

  // ── Hoja 2: Flujo de Caja ────────────────────────────────────────────────
  const cashflowSheet = workbook.addWorksheet('Flujo de Caja');
  cashflowSheet.columns = [
    { header: 'Mes', key: 'month', width: 15 },
    { header: `Ingresos (${currencySymbol})`, key: 'income', width: 20 },
    { header: `Gastos (${currencySymbol})`, key: 'expense', width: 20 },
    { header: 'Diferencia', key: 'difference', width: 20 },
  ];

  for (const row of data.cashflowData) {
    cashflowSheet.addRow({
      month: row.month,
      income: fromCents(row.income),
      expense: fromCents(row.expense),
      difference: fromCents(row.income - row.expense),
    });
  }

  styleSheet(cashflowSheet, numFmt, 2);

  // ── Hoja 3: Gastos por Categoría ─────────────────────────────────────────
  const totalSpending = data.spendingByCategory.reduce((s, r) => s + r.amount, 0);

  const categorySheet = workbook.addWorksheet('Gastos por Categoría');
  categorySheet.columns = [
    { header: 'Categoría', key: 'name', width: 30 },
    { header: `Monto (${currencySymbol})`, key: 'amount', width: 20 },
    { header: '% del Total', key: 'percentage', width: 15 },
  ];

  for (const row of data.spendingByCategory) {
    categorySheet.addRow({
      name: row.name,
      amount: fromCents(row.amount),
      percentage: totalSpending > 0 ? row.amount / totalSpending : 0,
    });
  }

  styleSheet(categorySheet, numFmt, 2);
  categorySheet.getColumn('percentage')!.numFmt = '0.0%';

  // ── Hoja 4: Movimientos del Mes ──────────────────────────────────────────
  const movementsSheet = workbook.addWorksheet('Movimientos del Mes');
  movementsSheet.columns = [
    { header: 'Fecha', key: 'date', width: 14 },
    { header: 'Tipo', key: 'type', width: 16 },
    { header: 'Categoría', key: 'category', width: 22 },
    { header: 'Descripción', key: 'description', width: 40 },
    { header: 'Cuenta', key: 'account', width: 22 },
    { header: `Monto (${currencySymbol})`, key: 'amount', width: 20 },
  ];

  for (const row of data.currentMonthMovements) {
    movementsSheet.addRow(row);
  }

  const movesHeaderRow = movementsSheet.getRow(1);
  movesHeaderRow.font = { bold: true };
  movesHeaderRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF6366F1' },
    };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  });

  for (let i = 2; i <= movementsSheet.rowCount; i++) {
    const row = movementsSheet.getRow(i);
    const amountCell = row.getCell(6);
    (amountCell as import('exceljs').Cell).numFmt = numFmt;
  }

  // ── Descargar ────────────────────────────────────────────────────────────
  const now = new Date();
  const fileName = `reporte-financiero-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}.xlsx`;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, fileName);
}

function styleSheet(
  sheet: import('exceljs').Worksheet,
  numFmt: string,
  dataStartRow = 2,
): void {
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF6366F1' },
    };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  });

  for (let i = dataStartRow; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);
    row.eachCell((cell, colNumber) => {
      if (colNumber > 1) {
        cell.numFmt = numFmt;
      }
    });
  }
}
