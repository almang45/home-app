import pb from '@/lib/pocketbase';
import { logger } from '@/lib/logger';
import type {
    FinanceSource,
    Transaction,
    Budget,
    Debt,
    Subscription,
    Reflection,
    financeSourceSchema,
    transactionSchema,
    budgetSchema,
    debtSchema,
    subscriptionSchema,
    reflectionSchema
} from './schema';
import type { z } from 'zod';

// --- Sources ---
export async function getSources() {
    const records = await pb.collection('finance_sources').getFullList<FinanceSource>({
        sort: '-created',
    });
    return records;
}

export async function getCategories() {
    const records = await pb.collection('finance_categories').getFullList<{ id: string, name: string, type: 'income' | 'expense' }>({
        sort: 'name',
    });
    return records;
}

export async function getSubcategories() {
    const records = await pb.collection('finance_subcategories').getFullList<{ id: string, name: string, category_id: string }>({
        sort: 'name',
    });
    return records;
}

export async function createSource(data: z.infer<typeof financeSourceSchema>) {
    return await pb.collection('finance_sources').create({ ...data, user_id: pb.authStore.model?.id });
}

export async function updateSource(id: string, data: Partial<z.infer<typeof financeSourceSchema>>) {
    return await pb.collection('finance_sources').update(id, data);
}

export async function deleteSource(id: string) {
    return await pb.collection('finance_sources').delete(id);
}

// --- Transactions ---
export async function getTransactions(month?: string) {
    // If month is provided (YYYY-MM), filter by date
    let filter = '';
    if (month) {
        filter = `date >= "${month}-01 00:00:00" && date <= "${month}-31 23:59:59"`;
    }
    return await pb.collection('finance_transactions').getFullList<Transaction>({
        sort: '-date',
        expand: 'source_id,category,subcategory',
        filter
    });
}

export async function createTransaction(data: z.infer<typeof transactionSchema>) {
    // 1. Create Transaction
    const record = await pb.collection('finance_transactions').create({ ...data, user_id: pb.authStore.model?.id });

    // 2. Update Source Balance
    const source = await pb.collection('finance_sources').getOne<FinanceSource>(data.source_id);
    let newBalance = source.balance;

    if (data.type === 'expense' || data.type === 'debt_repayment' || data.type === 'transfer') {
        newBalance -= data.amount;
    } else if (data.type === 'income') {
        newBalance += data.amount;
    }
    // Transfer logic would require 'to_source_id', keeping it simple for now or handling separately

    await pb.collection('finance_sources').update(source.id, { balance: newBalance });

    return record;
}

export async function createBulkTransactions(transactions: z.infer<typeof transactionSchema>[]) {
    // We'll process them sequentially to ensure balance updates are correct
    // In a real production app, this should be a backend transaction or batch operation
    const results = [];
    for (const tx of transactions) {
        try {
            const result = await createTransaction(tx);
            results.push(result);
        } catch (error) {
            logger.error("Failed to create transaction in bulk:", tx, error);
            // Continue with others or throw? For now, we continue but log error
        }
    }
    return results;
}

// --- Budgets ---
export async function getBudgets(month: string) {
    return await pb.collection('finance_budgets').getFullList<Budget>({
        filter: `month = "${month}"`
    });
}

export async function setBudget(data: z.infer<typeof budgetSchema>) {
    // Check if budget exists for this category and month
    const existing = await pb.collection('finance_budgets').getList(1, 1, {
        filter: `category = "${data.category}" && month = "${data.month}"`
    });

    if (existing.items.length > 0) {
        return await pb.collection('finance_budgets').update(existing.items[0].id, data);
    } else {
        return await pb.collection('finance_budgets').create({ ...data, user_id: pb.authStore.model?.id });
    }
}

// --- Debts ---
export async function getDebts() {
    return await pb.collection('finance_debts').getFullList<Debt>({ sort: '-created' });
}

export async function createDebt(data: z.infer<typeof debtSchema>) {
    return await pb.collection('finance_debts').create({ ...data, user_id: pb.authStore.model?.id });
}

export async function updateDebt(id: string, data: Partial<z.infer<typeof debtSchema>>) {
    return await pb.collection('finance_debts').update(id, data);
}

// --- Subscriptions ---
export async function getSubscriptions() {
    return await pb.collection('finance_subscriptions').getFullList<Subscription>({ sort: 'next_billing_date', expand: 'source_id' });
}

export async function createSubscription(data: z.infer<typeof subscriptionSchema>) {
    return await pb.collection('finance_subscriptions').create({ ...data, user_id: pb.authStore.model?.id });
}

// --- Reflections ---
export async function getReflection(month: string) {
    const records = await pb.collection('finance_reflections').getList<Reflection>(1, 1, {
        filter: `month = "${month}"`
    });
    return records.items[0] || null;
}

export async function saveReflection(data: z.infer<typeof reflectionSchema>) {
    const existing = await getReflection(data.month);
    if (existing) {
        return await pb.collection('finance_reflections').update(existing.id, data);
    } else {
        return await pb.collection('finance_reflections').create({ ...data, user_id: pb.authStore.model?.id });
    }
}
