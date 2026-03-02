import { z } from 'zod';

// --- Enums ---
export const FinanceSourceType = z.enum(['bank', 'savings', 'credit_card', 'e_wallet', 'cash']);
export const TransactionType = z.enum(['expense', 'income', 'transfer', 'debt_repayment']);
export const TransactionCategory = z.enum([
    'needs', 'wants', 'culture', 'unexpected', 'savings', // Expense
    'salary', 'investments', 'gifts', 'other_income' // Income
]);
export const TransactionSubcategory = z.enum([
    // Expense
    'health', 'entertainment', 'house', 'cleaning', 'snacks',
    'meals', 'transportation', 'utilities', 'clothing', 'personal', 'education', 'other',
    // Income
    'paycheck', 'bonus', 'side_hustle',
    'interest', 'dividends', 'bonds', 'crypto', 'stocks',
    'allowance', 'gift',
    'refunds', 'sales'
]);
export const DebtType = z.enum(['payable', 'receivable']);
export const BillingCycle = z.enum(['monthly', 'yearly']);

// --- Schemas ---

export const financeSourceSchema = z.object({
    name: z.string().min(1, "Name is required"),
    type: FinanceSourceType,
    balance: z.coerce.number(),
});

export const transactionSchema = z.object({
    amount: z.coerce.number().min(1, "Amount must be positive"),
    type: TransactionType,
    category: z.string().min(1, "Category is required"),
    subcategory: z.string().optional(),
    source_id: z.string().min(1, "Source is required"),
    date: z.date(),
    description: z.string().optional(),
});

export const budgetSchema = z.object({
    category: z.string().min(1, "Category is required"),
    amount: z.coerce.number().min(1, "Amount must be positive"),
    month: z.string().regex(/^\d{4}-\d{2}$/, "Format must be YYYY-MM"),
});

export const debtSchema = z.object({
    name: z.string().min(1, "Name is required"),
    type: DebtType,
    amount: z.coerce.number().min(1),
    remaining_amount: z.coerce.number().min(0),
    due_date: z.date().optional(),
});

export const subscriptionSchema = z.object({
    name: z.string().min(1, "Name is required"),
    cost: z.number().min(0, "Cost must be positive"),
    billing_cycle: BillingCycle,
    next_billing_date: z.date(),
    source_id: z.string().min(1, "Source is required"),
    category: z.string().min(1, "Category is required"),
    subcategory: z.string().optional(),
});

export const reflectionSchema = z.object({
    month: z.string().regex(/^\d{4}-\d{2}$/),
    content: z.string().min(1, "Content is required"),
});

// --- Types ---
// --- Types ---
export type FinanceSourceFormValues = z.infer<typeof financeSourceSchema>;
export type FinanceSource = FinanceSourceFormValues & { id: string; created: string; updated: string };

export type TransactionFormValues = z.infer<typeof transactionSchema>;
export type Transaction = TransactionFormValues & {
    id: string;
    created: string;
    updated: string;
    expand?: {
        source_id?: FinanceSource;
        category?: { id: string; name: string; type: 'income' | 'expense' };
        subcategory?: { id: string; name: string; category_id: string };
    }
};

export type BudgetFormValues = z.infer<typeof budgetSchema>;
export type Budget = BudgetFormValues & { id: string; created: string; updated: string };

export type DebtFormValues = z.infer<typeof debtSchema>;
export type Debt = DebtFormValues & { id: string; created: string; updated: string };

export type SubscriptionFormValues = z.infer<typeof subscriptionSchema>;
export type Subscription = SubscriptionFormValues & { id: string; created: string; updated: string; expand?: { source_id: FinanceSource } };

export type ReflectionFormValues = z.infer<typeof reflectionSchema>;
export type Reflection = ReflectionFormValues & { id: string; created: string; updated: string };
