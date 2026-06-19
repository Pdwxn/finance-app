export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface User extends BaseEntity {
  email: string;
  name: string;
  passwordHash?: string; // Solo usado en el backend
}

export type AccountType = 'cash' | 'checking' | 'savings' | 'investment' | 'credit';

export interface Account extends BaseEntity {
  userId: string;
  name: string;
  type: AccountType;
  currency: string;
  initialBalance: number; // Monto en centavos
}

export type CategoryType = 'expense' | 'income';

export interface Category extends BaseEntity {
  userId: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
}

export interface Expense extends BaseEntity {
  userId: string;
  accountId: string;
  categoryId: string;
  amount: number; // Monto en centavos
  description: string;
  transactionDate: string; // Formato YYYY-MM-DD
}

export interface Income extends BaseEntity {
  userId: string;
  accountId: string;
  categoryId: string;
  amount: number; // Monto en centavos
  description: string;
  transactionDate: string; // Formato YYYY-MM-DD
}

export interface Transfer extends BaseEntity {
  userId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number; // Monto en centavos
  description: string;
  transactionDate: string; // Formato YYYY-MM-DD
}

export interface CreditCard extends BaseEntity {
  userId: string;
  name: string;
  limitAmount: number; // Monto en centavos
  closingDay: number; // Día del mes (1-31)
  dueDay: number; // Día del mes (1-31)
}

export interface CardCharge extends BaseEntity {
  creditCardId: string;
  categoryId: string;
  amount: number; // Monto en centavos
  description: string;
  transactionDate: string; // Formato YYYY-MM-DD
}

export interface CardPayment extends BaseEntity {
  creditCardId: string;
  accountId: string;
  amount: number; // Monto en centavos
  paymentDate: string; // Formato YYYY-MM-DD
}

export interface Debt extends BaseEntity {
  userId: string;
  name: string;
  initialAmount: number; // Monto en centavos
  interestRate: number; // Porcentaje, ej: 12.5 para 12.5%
  startDate: string; // Formato YYYY-MM-DD
}

export interface DebtPayment extends BaseEntity {
  debtId: string;
  amount: number; // Monto en centavos
  paymentDate: string; // Formato YYYY-MM-DD
}

export interface Goal extends BaseEntity {
  userId: string;
  name: string;
  targetAmount: number; // Monto en centavos
  targetDate: string; // Formato YYYY-MM-DD
}

export interface GoalContribution extends BaseEntity {
  goalId: string;
  accountId: string;
  amount: number; // Monto en centavos
  contributionDate: string; // Formato YYYY-MM-DD
}

export interface Investment extends BaseEntity {
  userId: string;
  symbol: string;
  name: string;
  quantity: number; // Número de acciones/participaciones (puede tener decimales)
  averageCost: number; // Costo promedio en centavos
}

export type InvestmentTransactionType = 'buy' | 'sell';

export interface InvestmentTransaction extends BaseEntity {
  investmentId: string;
  type: InvestmentTransactionType;
  quantity: number; // Cantidad de acciones transadas
  price: number; // Precio unitario en centavos
  transactionDate: string; // Formato YYYY-MM-DD
}
