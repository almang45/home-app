import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Save } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

import {
    useTransactions,
    useBudgets,
    useReflection,
    useCategories,
    useSubcategories,
    useSubscriptions,
    useSaveReflection,
} from '../data/queries';
import { formatCurrency, cn } from '@/lib/utils';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#a4de6c', '#d0ed57', '#ffc658'];

export function MonthlySummary() {
    const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [reflectionText, setReflectionText] = useState('');

    const { data: transactions = [] } = useTransactions(month);
    const { data: budgets = [] } = useBudgets(month);
    const { data: reflection } = useReflection(month);
    const { data: categories = [] } = useCategories();
    const { data: subcategories = [] } = useSubcategories();
    const { data: subscriptions = [] } = useSubscriptions();
    const saveReflection = useSaveReflection();

    const [prevReflection, setPrevReflection] = useState(reflection);
    if (prevReflection !== reflection) {
        setPrevReflection(reflection);
        setReflectionText(reflection?.content ?? '');
    }

    const handleSaveReflection = async () => {
        try {
            await saveReflection.mutateAsync({ month, content: reflectionText });
            toast.success("Reflection saved");
        } catch (_error) {
            toast.error("Failed to save reflection");
        }
    };

    // Calculations
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
        .filter(t => t.type === 'expense' || t.type === 'debt_repayment')
        .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpenses;

    const totalSubscriptionCost = subscriptions.reduce((acc, sub) => {
        return acc + (sub.billing_cycle === 'monthly' ? sub.cost : sub.cost / 12);
    }, 0);

    // Category Breakdown
    const categoryData = useMemo(() => {
        return categories
            .filter(c => c.type === 'expense')
            .map(cat => {
                const spent = transactions
                    .filter(t => t.category === cat.id && (t.type === 'expense' || t.type === 'debt_repayment'))
                    .reduce((sum, t) => sum + t.amount, 0);
                const budget = budgets.find(b => b.category === cat.id)?.amount || 0;
                return { name: cat.name, value: spent, budget, id: cat.id };
            })
            .sort((a, b) => b.value - a.value);
    }, [categories, transactions, budgets]);

    const pieData = categoryData.filter(d => d.value > 0);

    // Subcategory Breakdown
    const subcategoryData = useMemo(() => {
        return subcategories.map(sub => {
            const spent = transactions
                .filter(t => t.subcategory === sub.id && (t.type === 'expense' || t.type === 'debt_repayment'))
                .reduce((sum, t) => sum + t.amount, 0);
            return { name: sub.name, value: spent };
        }).filter(d => d.value > 0).sort((a, b) => b.value - a.value);
    }, [subcategories, transactions]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight">Monthly Evaluation</h2>
                <div className="w-[200px]">
                    <Input
                        type="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                    />
                </div>
            </div>

            {/* High Level Summary */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Net Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            {formatCurrency(balance)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Fixed Costs (Subs)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{formatCurrency(totalSubscriptionCost)}</div>
                        <p className="text-xs text-muted-foreground">Est. Monthly</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Spending Breakdown Chart */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Spending by Category</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {pieData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                No expense data for this month
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Subcategory Breakdown Chart */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Spending by Subcategory</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {subcategoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={subcategoryData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={80}
                                        fill="#82ca9d"
                                        dataKey="value"
                                    >
                                        {subcategoryData.map((_, index) => (
                                            <Cell key={`cell-sub-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                No expense data for this month
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Budget vs Actual */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Budget vs Actual</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {categoryData.map(cat => {
                            const percent = cat.budget > 0 ? (cat.value / cat.budget) * 100 : 0;
                            const isOver = cat.value > cat.budget && cat.budget > 0;

                            return (
                                <div key={cat.id} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="capitalize font-medium">{cat.name}</span>
                                        <span className="text-muted-foreground">
                                            {formatCurrency(cat.value)} / {cat.budget > 0 ? formatCurrency(cat.budget) : 'No Limit'}
                                        </span>
                                    </div>
                                    <Progress
                                        value={Math.min(percent, 100)}
                                        className={cn("h-2", isOver ? "bg-red-100" : "")}
                                    />
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            </div>

            {/* Kakeibo Reflection */}
            <Card>
                <CardHeader>
                    <CardTitle>Monthly Reflection (Kakeibo)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>How can I improve next month?</Label>
                        <Textarea
                            placeholder="Write your reflection here..."
                            value={reflectionText}
                            onChange={(e) => setReflectionText(e.target.value)}
                            rows={4}
                        />
                    </div>
                    <Button onClick={handleSaveReflection} className="gap-2" disabled={saveReflection.isPending}>
                        <Save className="h-4 w-4" /> Save Reflection
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
