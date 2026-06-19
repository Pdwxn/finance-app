import { z } from 'zod';

// Regex para validar formato de fecha YYYY-MM-DD
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

// 1. Schema para Registro de Usuario (userSchema)
export const userSchema = z.object({
  email: z.string().email({ message: 'Email no válido' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
  name: z.string().min(1, { message: 'El nombre es obligatorio' }),
});

// Schema adicional para Login
export const userLoginSchema = z.object({
  email: z.string().email({ message: 'Email no válido' }),
  password: z.string().min(1, { message: 'La contraseña es obligatoria' }),
});

// 2. Schema para Cuentas (accountSchema)
export const accountSchema = z.object({
  id: z.string().uuid({ message: 'ID de cuenta debe ser un UUID válido' }),
  name: z.string().min(1, { message: 'El nombre de la cuenta es obligatorio' }),
  type: z.enum(['cash', 'checking', 'savings', 'investment', 'credit'], {
    errorMap: () => ({ message: 'Tipo de cuenta no válido' }),
  }),
  currency: z
    .string()
    .min(1, { message: 'La divisa es obligatoria' })
    .max(5, { message: 'Divisa demasiado larga' }),
  initialBalance: z
    .number()
    .int({ message: 'El balance inicial debe ser un número entero (centavos)' }),
});

// 3. Schema para Categorías (categorySchema)
export const categorySchema = z.object({
  id: z.string().uuid({ message: 'ID de categoría debe ser un UUID válido' }),
  name: z.string().min(1, { message: 'El nombre de la categoría es obligatorio' }),
  type: z.enum(['expense', 'income'], {
    errorMap: () => ({ message: 'Tipo de categoría no válido' }),
  }),
  icon: z.string().min(1, { message: 'El ícono es obligatorio' }),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, {
      message: 'El color debe ser un código HEX válido (ej: #FF0000)',
    }),
});

// 4. Schema para Gastos (expenseSchema)
export const expenseSchema = z.object({
  id: z.string().uuid({ message: 'ID del gasto debe ser un UUID válido' }),
  accountId: z.string().uuid({ message: 'ID de cuenta de origen debe ser un UUID válido' }),
  categoryId: z.string().uuid({ message: 'ID de categoría debe ser un UUID válido' }),
  amount: z
    .number()
    .int({ message: 'El monto debe ser un entero' })
    .positive({ message: 'El monto debe ser mayor a cero' }),
  description: z
    .string()
    .min(1, { message: 'La descripción es obligatoria' })
    .max(255, { message: 'La descripción no puede superar los 255 caracteres' }),
  transactionDate: z
    .string()
    .regex(dateRegex, { message: 'La fecha de transacción debe tener formato YYYY-MM-DD' }),
});

// 5. Schema para Ingresos (incomeSchema)
export const incomeSchema = z.object({
  id: z.string().uuid({ message: 'ID del ingreso debe ser un UUID válido' }),
  accountId: z.string().uuid({ message: 'ID de cuenta de destino debe ser un UUID válido' }),
  categoryId: z.string().uuid({ message: 'ID de categoría debe ser un UUID válido' }),
  amount: z
    .number()
    .int({ message: 'El monto debe ser un entero' })
    .positive({ message: 'El monto debe ser mayor a cero' }),
  description: z
    .string()
    .min(1, { message: 'La descripción es obligatoria' })
    .max(255, { message: 'La descripción no puede superar los 255 caracteres' }),
  transactionDate: z
    .string()
    .regex(dateRegex, { message: 'La fecha de transacción debe tener formato YYYY-MM-DD' }),
});

// 6. Schema para Transferencias (transferSchema)
export const transferSchema = z
  .object({
    id: z.string().uuid({ message: 'ID de la transferencia debe ser un UUID válido' }),
    fromAccountId: z.string().uuid({ message: 'ID de cuenta origen debe ser un UUID válido' }),
    toAccountId: z.string().uuid({ message: 'ID de cuenta destino debe ser un UUID válido' }),
    amount: z
      .number()
      .int({ message: 'El monto debe ser un entero' })
      .positive({ message: 'El monto debe ser mayor a cero' }),
    description: z
      .string()
      .min(1, { message: 'La descripción es obligatoria' })
      .max(255, { message: 'La descripción no puede superar los 255 caracteres' }),
    transactionDate: z
      .string()
      .regex(dateRegex, { message: 'La fecha de transacción debe tener formato YYYY-MM-DD' }),
  })
  .refine((data) => data.fromAccountId !== data.toAccountId, {
    message: 'La cuenta de origen y de destino deben ser diferentes',
    path: ['toAccountId'],
  });

// 7. Schema para Cargos de Tarjeta (cardChargeSchema)
export const cardChargeSchema = z.object({
  id: z.string().uuid({ message: 'ID del cargo debe ser un UUID válido' }),
  creditCardId: z.string().uuid({ message: 'ID de tarjeta debe ser un UUID válido' }),
  categoryId: z.string().uuid({ message: 'ID de categoría debe ser un UUID válido' }),
  amount: z
    .number()
    .int({ message: 'El monto debe ser un entero' })
    .positive({ message: 'El monto debe ser mayor a cero' }),
  description: z
    .string()
    .min(1, { message: 'La descripción es obligatoria' })
    .max(255, { message: 'La descripción no puede superar los 255 caracteres' }),
  transactionDate: z
    .string()
    .regex(dateRegex, { message: 'La fecha de transacción debe tener formato YYYY-MM-DD' }),
});

// 8. Schema para Pagos de Tarjeta (cardPaymentSchema)
export const cardPaymentSchema = z.object({
  id: z.string().uuid({ message: 'ID del pago debe ser un UUID válido' }),
  creditCardId: z.string().uuid({ message: 'ID de tarjeta debe ser un UUID válido' }),
  accountId: z.string().uuid({ message: 'ID de cuenta debe ser un UUID válido' }),
  amount: z
    .number()
    .int({ message: 'El monto debe ser un entero' })
    .positive({ message: 'El monto debe ser mayor a cero' }),
  paymentDate: z
    .string()
    .regex(dateRegex, { message: 'La fecha de pago debe tener formato YYYY-MM-DD' }),
});

// 9. Schema para Deudas (debtSchema)
export const debtSchema = z.object({
  id: z.string().uuid({ message: 'ID de la deuda debe ser un UUID válido' }),
  name: z.string().min(1, { message: 'El nombre de la deuda es obligatorio' }),
  initialAmount: z
    .number()
    .int({ message: 'El monto inicial debe ser un entero' })
    .positive({ message: 'El monto inicial debe ser mayor a cero' }),
  interestRate: z
    .number()
    .positive({ message: 'La tasa de interés debe ser mayor a cero' }),
  startDate: z
    .string()
    .regex(dateRegex, { message: 'La fecha de inicio debe tener formato YYYY-MM-DD' }),
});

// 10. Schema para Pagos de Deuda (debtPaymentSchema)
export const debtPaymentSchema = z.object({
  id: z.string().uuid({ message: 'ID del pago debe ser un UUID válido' }),
  debtId: z.string().uuid({ message: 'ID de deuda debe ser un UUID válido' }),
  amount: z
    .number()
    .int({ message: 'El monto debe ser un entero' })
    .positive({ message: 'El monto debe ser mayor a cero' }),
  paymentDate: z
    .string()
    .regex(dateRegex, { message: 'La fecha de pago debe tener formato YYYY-MM-DD' }),
});

// 11. Schema para Metas (goalSchema)
export const goalSchema = z.object({
  id: z.string().uuid({ message: 'ID de la meta debe ser un UUID válido' }),
  name: z.string().min(1, { message: 'El nombre de la meta es obligatorio' }),
  targetAmount: z
    .number()
    .int({ message: 'El monto objetivo debe ser un entero' })
    .positive({ message: 'El monto objetivo debe ser mayor a cero' }),
  targetDate: z
    .string()
    .regex(dateRegex, { message: 'La fecha objetivo debe tener formato YYYY-MM-DD' }),
});

// 12. Schema para Contribuciones a Meta (goalContributionSchema)
export const goalContributionSchema = z.object({
  id: z.string().uuid({ message: 'ID de la contribución debe ser un UUID válido' }),
  goalId: z.string().uuid({ message: 'ID de meta debe ser un UUID válido' }),
  accountId: z.string().uuid({ message: 'ID de cuenta debe ser un UUID válido' }),
  amount: z
    .number()
    .int({ message: 'El monto debe ser un entero' })
    .positive({ message: 'El monto debe ser mayor a cero' }),
  contributionDate: z
    .string()
    .regex(dateRegex, { message: 'La fecha de contribución debe tener formato YYYY-MM-DD' }),
});

// 13. Schema para Inversiones (investmentSchema)
export const investmentSchema = z.object({
  id: z.string().uuid({ message: 'ID de la inversión debe ser un UUID válido' }),
  symbol: z.string().min(1, { message: 'El símbolo es obligatorio' }),
  name: z.string().min(1, { message: 'El nombre es obligatorio' }),
  quantity: z
    .number()
    .positive({ message: 'La cantidad debe ser mayor a cero' }),
  averageCost: z
    .number()
    .int({ message: 'El costo promedio debe ser un entero (centavos)' })
    .positive({ message: 'El costo promedio debe ser mayor a cero' }),
});

// 14. Schema para Transacciones de Inversión (investmentTransactionSchema)
export const investmentTransactionSchema = z.object({
  id: z.string().uuid({ message: 'ID de la transacción debe ser un UUID válido' }),
  investmentId: z.string().uuid({ message: 'ID de inversión debe ser un UUID válido' }),
  type: z.enum(['buy', 'sell'], {
    errorMap: () => ({ message: 'Tipo de transacción no válido. Debe ser buy o sell' }),
  }),
  quantity: z
    .number()
    .positive({ message: 'La cantidad debe ser mayor a cero' }),
  price: z
    .number()
    .int({ message: 'El precio debe ser un entero (centavos)' })
    .positive({ message: 'El precio debe ser mayor a cero' }),
  transactionDate: z
    .string()
    .regex(dateRegex, { message: 'La fecha de transacción debe tener formato YYYY-MM-DD' }),
});
