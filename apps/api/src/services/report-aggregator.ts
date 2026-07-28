import { eq, and, isNull, gte, lte, sql } from 'drizzle-orm';
import { db } from '../config/db';
import { expenses } from '../db/schema/expenses';
import { incomes } from '../db/schema/incomes';
import { categories } from '../db/schema/categories';
import { accounts } from '../db/schema/accounts';
import { budgets } from '../db/schema/budgets';
import { cardCharges } from '../db/schema/card-charges';


interface CategorySummary {
  categoryId: string;
  name: string;
  amount: number;
  percentage: number;
}

interface BudgetAtRisk {
  categoryId: string;
  name: string;
  used: number;
  limit: number;
}

interface TopExpense {
  description: string;
  amount: number;
  category: string;
}

export interface AggregatedData {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  incomeByCategory: CategorySummary[];
  expenseByCategory: CategorySummary[];
  budgetsAtRisk: BudgetAtRisk[];
  topExpenses: TopExpense[];
  currency: string;
  comparisonPrevious?: {
    incomeChange: number;
    expensesChange: number;
    balanceChange: number;
  };
}

export async function aggregatePeriod(
  userId: string,
  startDate: string,
  endDate: string,
  previousStartDate?: string,
  previousEndDate?: string,
): Promise<{ current: AggregatedData; comparison?: AggregatedData }> {
  const [current, comparison] = await Promise.all([
    aggregateSingle(userId, startDate, endDate),
    previousStartDate && previousEndDate
      ? aggregateSingle(userId, previousStartDate, previousEndDate)
      : Promise.resolve(undefined),
  ]);

  return { current, comparison };
}

async function aggregateSingle(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<AggregatedData> {
  const userCurrency = await getUserCurrency(userId);

  const [totalIncomeResult, totalExpensesResult, incomeByCategory, expenseByCategory, budgetsAtRisk, topExpenses] = await Promise.all([
    getTotalIncome(userId, startDate, endDate),
    getTotalExpenses(userId, startDate, endDate),
    getIncomeByCategory(userId, startDate, endDate),
    getExpenseByCategory(userId, startDate, endDate),
    getBudgetsAtRisk(userId, startDate, endDate),
    getTopExpenses(userId, startDate, endDate),
  ]);

  const totalIncome = totalIncomeResult ?? 0;
  const totalExpenses = totalExpensesResult ?? 0;

  const incomeByCategoryWithPct = incomeByCategory.map(c => ({
    ...c,
    percentage: totalIncome > 0 ? Math.round((c.amount / totalIncome) * 100) : 0,
  }));

  const expenseByCategoryWithPct = expenseByCategory.map(c => ({
    ...c,
    percentage: totalExpenses > 0 ? Math.round((c.amount / totalExpenses) * 100) : 0,
  }));

  return {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    incomeByCategory: incomeByCategoryWithPct,
    expenseByCategory: expenseByCategoryWithPct,
    budgetsAtRisk,
    topExpenses,
    currency: userCurrency,
  };
}

async function getUserCurrency(userId: string): Promise<string> {
  const result = await db
    .select({ currency: accounts.currency })
    .from(accounts)
    .where(and(eq(accounts.userId, userId), isNull(accounts.deletedAt)))
    .limit(1);
  return result[0]?.currency ?? 'CLP';
}

async function getTotalIncome(userId: string, startDate: string, endDate: string): Promise<number> {
  const result = await db
    .select({ total: sql<number>`COALESCE(SUM(${incomes.amount}), 0)` })
    .from(incomes)
    .where(and(
      eq(incomes.userId, userId),
      gte(incomes.transactionDate, startDate),
      lte(incomes.transactionDate, endDate),
      isNull(incomes.deletedAt),
    ));
  return result[0]?.total ?? 0;
}

async function getTotalExpenses(userId: string, startDate: string, endDate: string): Promise<number> {
  const expenseTotal = db
    .select({ total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)` })
    .from(expenses)
    .where(and(
      eq(expenses.userId, userId),
      gte(expenses.transactionDate, startDate),
      lte(expenses.transactionDate, endDate),
      isNull(expenses.deletedAt),
    ));

  const chargesTotal = db
    .select({ total: sql<number>`COALESCE(SUM(${cardCharges.amount}), 0)` })
    .from(cardCharges)
    .innerJoin(accounts, eq(accounts.id, cardCharges.creditCardId))
    .where(and(
      eq(accounts.userId, userId),
      gte(cardCharges.transactionDate, startDate),
      lte(cardCharges.transactionDate, endDate),
      isNull(cardCharges.deletedAt),
      isNull(accounts.deletedAt),
    ));

  const [expenseResult, chargesResult] = await Promise.all([expenseTotal, chargesTotal]);
  return (expenseResult[0]?.total ?? 0) + (chargesResult[0]?.total ?? 0);
}

async function getIncomeByCategory(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<CategorySummary[]> {
  const result = await db
    .select({
      categoryId: incomes.categoryId,
      name: categories.name,
      amount: sql<number>`COALESCE(SUM(${incomes.amount}), 0)`,
    })
    .from(incomes)
    .innerJoin(categories, eq(incomes.categoryId, categories.id))
    .where(and(
      eq(incomes.userId, userId),
      gte(incomes.transactionDate, startDate),
      lte(incomes.transactionDate, endDate),
      isNull(incomes.deletedAt),
      isNull(categories.deletedAt),
    ))
    .groupBy(incomes.categoryId, categories.name);

  return result.map(r => ({ ...r, percentage: 0 }));
}

async function getExpenseByCategory(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<CategorySummary[]> {
  const expenseResult = await db
    .select({
      categoryId: expenses.categoryId,
      name: categories.name,
      amount: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
    })
    .from(expenses)
    .innerJoin(categories, eq(expenses.categoryId, categories.id))
    .where(and(
      eq(expenses.userId, userId),
      gte(expenses.transactionDate, startDate),
      lte(expenses.transactionDate, endDate),
      isNull(expenses.deletedAt),
      isNull(categories.deletedAt),
    ))
    .groupBy(expenses.categoryId, categories.name);

  const chargesResult = await db
    .select({
      categoryId: cardCharges.categoryId,
      name: categories.name,
      amount: sql<number>`COALESCE(SUM(${cardCharges.amount}), 0)`,
    })
    .from(cardCharges)
    .innerJoin(categories, eq(cardCharges.categoryId, categories.id))
    .innerJoin(accounts, eq(accounts.id, cardCharges.creditCardId))
    .where(and(
      eq(accounts.userId, userId),
      gte(cardCharges.transactionDate, startDate),
      lte(cardCharges.transactionDate, endDate),
      isNull(cardCharges.deletedAt),
      isNull(categories.deletedAt),
      isNull(accounts.deletedAt),
    ))
    .groupBy(cardCharges.categoryId, categories.name);

  const merged = new Map<string, CategorySummary>();
  for (const item of expenseResult) {
    merged.set(item.categoryId, { ...item, percentage: 0 });
  }
  for (const item of chargesResult) {
    const existing = merged.get(item.categoryId);
    if (existing) {
      existing.amount += item.amount;
    } else {
      merged.set(item.categoryId, { ...item, percentage: 0 });
    }
  }

  return Array.from(merged.values());
}

async function getBudgetsAtRisk(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<BudgetAtRisk[]> {
  const period = startDate.slice(0, 7);

  const userBudgets = await db
    .select({
      id: budgets.id,
      categoryId: budgets.categoryId,
      limitAmount: budgets.limitAmount,
      categoryName: categories.name,
    })
    .from(budgets)
    .innerJoin(categories, eq(budgets.categoryId, categories.id))
    .where(and(
      eq(budgets.userId, userId),
      eq(budgets.period, period),
      isNull(budgets.deletedAt),
      isNull(categories.deletedAt),
    ));

  const expenseByCategory = await getExpenseByCategory(userId, startDate, endDate);

  return userBudgets
    .map(b => {
      const spent = expenseByCategory.find(e => e.categoryId === b.categoryId)?.amount ?? 0;
      return {
        categoryId: b.categoryId,
        name: b.categoryName,
        used: spent,
        limit: b.limitAmount,
      };
    })
    .filter(b => b.limit > 0 && (b.used / b.limit) >= 0.75);
}

async function getTopExpenses(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<TopExpense[]> {
  const result = await db
    .select({
      description: expenses.description,
      amount: expenses.amount,
      category: categories.name,
    })
    .from(expenses)
    .innerJoin(categories, eq(expenses.categoryId, categories.id))
    .where(and(
      eq(expenses.userId, userId),
      gte(expenses.transactionDate, startDate),
      lte(expenses.transactionDate, endDate),
      isNull(expenses.deletedAt),
      isNull(categories.deletedAt),
    ))
    .orderBy(sql`${expenses.amount} DESC`)
    .limit(5);

  return result;
}
