import { useState, useMemo } from 'react';

import { toast } from 'sonner';
import { Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import { useBudgets, useCategories, useSetBudget } from '../data/queries';
import { formatCurrency } from '@/lib/utils';

export function BudgetPlanner() {
    const [month, setMonth] = useState<string>(new Date().toISOString().slice(0, 7));

    const { data: budgets = [] } = useBudgets(month);
    const { data: categories = [] } = useCategories();
    const setBudget = useSetBudget();

    const expenseCategories = useMemo(() => {
        return categories.filter(c => c.type === 'expense');
    }, [categories]);

    const handleSave = async (categoryId: string, amount: number, categoryName: string) => {
        try {
            await setBudget.mutateAsync({ category: categoryId, amount, month });
            toast.success(`Budget for ${categoryName} updated`);
        } catch (_error) {
            toast.error("Failed to save budget");
        }
    };

    const getBudgetAmount = (categoryId: string) => {
        return budgets.find(b => b.category === categoryId)?.amount || 0;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight">Monthly Budget</h2>
                <div className="w-[200px]">
                    <Input
                        type="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {expenseCategories.map(category => (
                    <BudgetCard
                        key={category.id}
                        name={category.name}
                        initialAmount={getBudgetAmount(category.id)}
                        onSave={(amount) => handleSave(category.id, amount, category.name)}
                    />
                ))}
            </div>
        </div>
    );
}

function BudgetCard({ name, initialAmount, onSave }: { name: string, initialAmount: number, onSave: (amount: number) => void }) {
    const [amount, setAmount] = useState(initialAmount);
    const [isDirty, setIsDirty] = useState(false);

    const [prevInitialAmount, setPrevInitialAmount] = useState(initialAmount);
    if (prevInitialAmount !== initialAmount) {
        setPrevInitialAmount(initialAmount);
        setAmount(initialAmount);
        setIsDirty(false);
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAmount(Number(e.target.value));
        setIsDirty(true);
    };

    const handleSave = () => {
        onSave(amount);
        setIsDirty(false);
    };

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium capitalize">
                    {name}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                            Rp
                        </span>
                        <Input
                            type="number"
                            value={amount}
                            onChange={handleChange}
                            className="pl-9"
                        />
                    </div>
                    {isDirty && (
                        <Button size="icon" onClick={handleSave} className="h-10 w-10">
                            <Save className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    Current: {formatCurrency(initialAmount)}
                </p>
            </CardContent>
        </Card>
    );
}
