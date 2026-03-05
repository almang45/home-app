import { useState } from 'react';
import { Plus, Wallet, TrendingUp, TrendingDown, Upload, FileText } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { SourceManager } from './source-manager';
import { TransactionForm } from './transaction-form';
import { BudgetPlanner } from './budget-planner';
import { DebtManager } from './debt-manager';
import { SubscriptionTracker } from './subscription-tracker';
import { MonthlySummary } from './monthly-summary';
import { BulkTransactionForm } from './bulk-transaction-form';
import { CsvImporter } from './csv-importer';

import { useSources, useTransactions } from '../data/queries';
import { formatCurrency } from '@/lib/utils';

export function FinanceDashboard() {
    const [isTransactionOpen, setIsTransactionOpen] = useState(false);
    const [isBulkOpen, setIsBulkOpen] = useState(false);
    const [isCsvOpen, setIsCsvOpen] = useState(false);

    const { data: sources = [] } = useSources();
    const { data: transactions = [] } = useTransactions();

    const totalBalance = sources.reduce((sum, source) => sum + source.balance, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Finance</h1>
                    <p className="text-muted-foreground">Manage your personal finances (Kakeibo Style)</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsCsvOpen(true)} className="gap-2">
                        <Upload className="h-4 w-4" /> Import CSV
                    </Button>
                    <Button variant="outline" onClick={() => setIsBulkOpen(true)} className="gap-2">
                        <FileText className="h-4 w-4" /> Bulk Add
                    </Button>
                    <Button onClick={() => setIsTransactionOpen(true)} className="gap-2">
                        <Plus className="h-4 w-4" /> Log Transaction
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
                    </CardContent>
                </Card>
                {/* Add more summary cards here if needed */}
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="accounts">Accounts</TabsTrigger>
                    <TabsTrigger value="budget">Budget</TabsTrigger>
                    <TabsTrigger value="debts">Debts</TabsTrigger>
                    <TabsTrigger value="subs">Subs</TabsTrigger>
                    <TabsTrigger value="analysis">Analysis</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="col-span-4">
                            <CardHeader>
                                <CardTitle>Recent Transactions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-8">
                                    {transactions.slice(0, 5).map(tx => (
                                        <div key={tx.id} className="flex items-center">
                                            <div className={`flex h-9 w-9 items-center justify-center rounded-full border ${tx.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                                                {tx.type === 'income' ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />}
                                            </div>
                                            <div className="ml-4 space-y-1">
                                                <p className="text-sm font-medium leading-none">{tx.description || tx.expand?.category?.name || 'Uncategorized'}</p>
                                                <p className="text-sm text-muted-foreground">{format(new Date(tx.date), 'PPP')}</p>
                                            </div>
                                            <div className={`ml-auto font-medium ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                                {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                            </div>
                                        </div>
                                    ))}
                                    {transactions.length === 0 && (
                                        <div className="text-center text-muted-foreground">No recent transactions</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="col-span-3">
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button variant="outline" className="w-full justify-start" onClick={() => setIsTransactionOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" /> Add Expense
                                </Button>
                                {/* Add more quick actions */}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
                <TabsContent value="accounts" className="space-y-4">
                    <SourceManager />
                </TabsContent>
                <TabsContent value="budget" className="space-y-4">
                    <BudgetPlanner />
                </TabsContent>
                <TabsContent value="debts" className="space-y-4">
                    <DebtManager />
                </TabsContent>
                <TabsContent value="subs" className="space-y-4">
                    <SubscriptionTracker />
                </TabsContent>
                <TabsContent value="analysis" className="space-y-4">
                    <MonthlySummary />
                </TabsContent>
            </Tabs>

            <TransactionForm
                open={isTransactionOpen}
                onOpenChange={setIsTransactionOpen}
            />
            <BulkTransactionForm
                open={isBulkOpen}
                onOpenChange={setIsBulkOpen}
            />
            <CsvImporter
                open={isCsvOpen}
                onOpenChange={setIsCsvOpen}
            />
        </div>
    );
}
