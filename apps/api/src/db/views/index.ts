import { db } from '../../config/db';
import { sql } from 'drizzle-orm';

export interface AccountBalanceRow {
  account_id: string;
  user_id: string;
  name: string;
  balance: string;
}

export async function getAccountBalances(userId: string): Promise<AccountBalanceRow[]> {
  const result = await db.execute(sql`SELECT * FROM account_balances WHERE user_id = ${userId}`);
  return result as unknown as AccountBalanceRow[];
}

export interface CategoryBudgetUsageRow {
  category_id: string;
  user_id: string;
  category_name: string;
  type: string;
  total_spent: string;
}

export async function getCategoryBudgetUsage(userId: string): Promise<CategoryBudgetUsageRow[]> {
  const result = await db.execute(sql`SELECT * FROM category_budget_usage WHERE user_id = ${userId}`);
  return result as unknown as CategoryBudgetUsageRow[];
}

export interface CreditCardBalanceRow {
  credit_card_id: string;
  user_id: string;
  name: string;
  limit_amount: string;
  current_balance: string;
  available_credit: string;
}

export async function getCreditCardBalances(userId: string): Promise<CreditCardBalanceRow[]> {
  const result = await db.execute(sql`SELECT * FROM credit_card_balances WHERE user_id = ${userId}`);
  return result as unknown as CreditCardBalanceRow[];
}

export interface DebtBalanceRow {
  debt_id: string;
  user_id: string;
  name: string;
  initial_amount: string;
  total_paid: string;
  remaining_balance: string;
}

export async function getDebtBalances(userId: string): Promise<DebtBalanceRow[]> {
  const result = await db.execute(sql`SELECT * FROM debt_balances WHERE user_id = ${userId}`);
  return result as unknown as DebtBalanceRow[];
}

export interface GoalProgressRow {
  goal_id: string;
  user_id: string;
  name: string;
  target_amount: string;
  total_contributed: string;
  remaining: string;
  progress_percentage: string;
}

export async function getGoalProgress(userId: string): Promise<GoalProgressRow[]> {
  const result = await db.execute(sql`SELECT * FROM goal_progress WHERE user_id = ${userId}`);
  return result as unknown as GoalProgressRow[];
}
