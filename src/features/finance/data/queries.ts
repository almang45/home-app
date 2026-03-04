import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { z } from 'zod';

import {
    createBulkTransactions,
    createDebt,
    createSource,
    createSubscription,
    createTransaction,
    deleteSource,
    getBudgets,
    getCategories,
    getDebts,
    getReflection,
    getSources,
    getSubcategories,
    getSubscriptions,
    getTransactions,
    saveReflection,
    setBudget,
    updateDebt,
} from './api';
import type {
    budgetSchema,
    debtSchema,
    financeSourceSchema,
    reflectionSchema,
    subscriptionSchema,
    transactionSchema,
} from './schema';

// --- Query Keys ---

export const financeKeys = {
    all: ['finance'] as const,
    sources: () => [...financeKeys.all, 'sources'] as const,
    transactions: (month?: string) => [...financeKeys.all, 'transactions', month ?? 'all'] as const,
    categories: () => [...financeKeys.all, 'categories'] as const,
    subcategories: () => [...financeKeys.all, 'subcategories'] as const,
    debts: () => [...financeKeys.all, 'debts'] as const,
    subscriptions: () => [...financeKeys.all, 'subscriptions'] as const,
    budgets: (month: string) => [...financeKeys.all, 'budgets', month] as const,
    reflection: (month: string) => [...financeKeys.all, 'reflection', month] as const,
};

// --- Query Hooks ---

export function useSources() {
    return useQuery({ queryKey: financeKeys.sources(), queryFn: getSources });
}

export function useTransactions(month?: string) {
    return useQuery({
        queryKey: financeKeys.transactions(month),
        queryFn: () => getTransactions(month),
    });
}

export function useCategories() {
    return useQuery({ queryKey: financeKeys.categories(), queryFn: getCategories });
}

export function useSubcategories() {
    return useQuery({ queryKey: financeKeys.subcategories(), queryFn: getSubcategories });
}

export function useDebts() {
    return useQuery({ queryKey: financeKeys.debts(), queryFn: getDebts });
}

export function useSubscriptions() {
    return useQuery({ queryKey: financeKeys.subscriptions(), queryFn: getSubscriptions });
}

export function useBudgets(month: string) {
    return useQuery({ queryKey: financeKeys.budgets(month), queryFn: () => getBudgets(month) });
}

export function useReflection(month: string) {
    return useQuery({ queryKey: financeKeys.reflection(month), queryFn: () => getReflection(month) });
}

// --- Mutation Hooks ---

export function useCreateSource() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: z.infer<typeof financeSourceSchema>) => createSource(data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: financeKeys.sources() }),
    });
}

export function useDeleteSource() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteSource(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: financeKeys.sources() }),
    });
}

export function useCreateTransaction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: z.infer<typeof transactionSchema>) => createTransaction(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: financeKeys.sources() });
            queryClient.invalidateQueries({ queryKey: financeKeys.all });
        },
    });
}

export function useCreateBulkTransactions() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: z.infer<typeof transactionSchema>[]) => createBulkTransactions(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: financeKeys.sources() });
            queryClient.invalidateQueries({ queryKey: financeKeys.all });
        },
    });
}

export function useCreateDebt() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: z.infer<typeof debtSchema>) => createDebt(data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: financeKeys.debts() }),
    });
}

export function useUpdateDebt() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<z.infer<typeof debtSchema>> }) =>
            updateDebt(id, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: financeKeys.debts() }),
    });
}

export function useCreateSubscription() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: z.infer<typeof subscriptionSchema>) => createSubscription(data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: financeKeys.subscriptions() }),
    });
}

export function useSetBudget() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: z.infer<typeof budgetSchema>) => setBudget(data),
        onSuccess: (_result, variables) =>
            queryClient.invalidateQueries({ queryKey: financeKeys.budgets(variables.month) }),
    });
}

export function useSaveReflection() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: z.infer<typeof reflectionSchema>) => saveReflection(data),
        onSuccess: (_result, variables) =>
            queryClient.invalidateQueries({ queryKey: financeKeys.reflection(variables.month) }),
    });
}
