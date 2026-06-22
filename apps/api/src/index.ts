import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import authRouter from './modules/auth/auth.router';
import accountsRouter from './modules/accounts/accounts.router';
import categoriesRouter from './modules/categories/categories.router';
import expensesRouter from './modules/expenses/expenses.router';
import incomesRouter from './modules/incomes/incomes.router';
import transfersRouter from './modules/transfers/transfers.router';
import creditCardsRouter from './modules/credit-cards/credit-cards.router';
import cardChargesRouter from './modules/card-charges/card-charges.router';
import cardPaymentsRouter from './modules/card-payments/card-payments.router';
import debtsRouter from './modules/debts/debts.router';
import debtPaymentsRouter from './modules/debt-payments/debt-payments.router';
import goalsRouter from './modules/goals/goals.router';
import goalContributionsRouter from './modules/goal-contributions/goal-contributions.router';
import investmentsRouter from './modules/investments/investments.router';
import investmentTransactionsRouter from './modules/investment-transactions/investment-transactions.router';
import syncRouter from './modules/sync/sync.router';

const app = express();

app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/incomes', incomesRouter);
app.use('/api/transfers', transfersRouter);
app.use('/api/credit-cards', creditCardsRouter);
app.use('/api/card-charges', cardChargesRouter);
app.use('/api/card-payments', cardPaymentsRouter);
app.use('/api/debts', debtsRouter);
app.use('/api/debt-payments', debtPaymentsRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/goal-contributions', goalContributionsRouter);
app.use('/api/investments', investmentsRouter);
app.use('/api/investment-transactions', investmentTransactionsRouter);
app.use('/api/sync', syncRouter);

app.listen(env.PORT, () => {
  console.log(`API running on http://localhost:${env.PORT}`);
});

export default app;
