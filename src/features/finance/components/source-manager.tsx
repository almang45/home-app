import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Wallet, CreditCard, Building2, Banknote, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { financeSourceSchema, FinanceSourceFormValues } from '../data/schema';
import { useSources, useCreateSource, useDeleteSource } from '../data/queries';
import { formatCurrency } from '@/lib/utils';

export function SourceManager() {
    const [isOpen, setIsOpen] = useState(false);

    const { data: sources = [] } = useSources();
    const createSource = useCreateSource();
    const deleteSource = useDeleteSource();

    const form = useForm<FinanceSourceFormValues>({
        resolver: zodResolver(financeSourceSchema) as any,
        defaultValues: {
            name: '',
            type: 'bank',
            balance: 0,
        },
    });

    const onSubmit = async (data: any) => {
        try {
            await createSource.mutateAsync(data);
            toast.success("Source created successfully");
            setIsOpen(false);
            form.reset();
        } catch (error) {
            toast.error("Failed to create source");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This will delete the source and all associated transactions.")) return;
        try {
            await deleteSource.mutateAsync(id);
            toast.success("Source deleted");
        } catch (error) {
            toast.error("Failed to delete source");
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'bank': return <Building2 className="h-5 w-5" />;
            case 'savings': return <Wallet className="h-5 w-5" />;
            case 'credit_card': return <CreditCard className="h-5 w-5" />;
            case 'e_wallet': return <Wallet className="h-5 w-5" />;
            case 'cash': return <Banknote className="h-5 w-5" />;
            default: return <Wallet className="h-5 w-5" />;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight">Accounts & Wallets</h2>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="gap-2">
                            <Plus className="h-4 w-4" /> Add Account
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Account</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Account Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. BCA, GoPay" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="bank">Bank Account</SelectItem>
                                                    <SelectItem value="savings">Savings</SelectItem>
                                                    <SelectItem value="credit_card">Credit Card</SelectItem>
                                                    <SelectItem value="e_wallet">E-Wallet</SelectItem>
                                                    <SelectItem value="cash">Cash</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="balance"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Current Balance</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    {...field}
                                                    onChange={e => field.onChange(e.target.valueAsNumber)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full" disabled={createSource.isPending}>
                                    Create Account
                                </Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sources.map((source) => (
                    <Card key={source.id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {source.name}
                            </CardTitle>
                            {getIcon(source.type)}
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(source.balance)}</div>
                            <div className="flex justify-between items-center mt-2">
                                <p className="text-xs text-muted-foreground capitalize">
                                    {source.type.replace('_', ' ')}
                                </p>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive/90" onClick={() => handleDelete(source.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
