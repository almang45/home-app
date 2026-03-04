import { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Plus, Calendar as CalendarIcon, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { format } from 'date-fns';

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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn, formatCurrency } from '@/lib/utils';

import { debtSchema, type Debt, type DebtFormValues } from '../data/schema';
import { useDebts, useCreateDebt, useUpdateDebt } from '../data/queries';

export function DebtManager() {
    const [isOpen, setIsOpen] = useState(false);

    const { data: debts = [] } = useDebts();
    const createDebt = useCreateDebt();
    const updateDebt = useUpdateDebt();

    const form = useForm<DebtFormValues>({
        resolver: zodResolver(debtSchema) as Resolver<DebtFormValues>,
        defaultValues: {
            name: '',
            type: 'payable',
            amount: 0,
            remaining_amount: 0,
        },
    });

    const onSubmit = async (data: DebtFormValues) => {
        try {
            if (data.remaining_amount === 0 && data.amount > 0) {
                data.remaining_amount = data.amount;
            }
            await createDebt.mutateAsync(data);
            toast.success("Record created successfully");
            setIsOpen(false);
            form.reset();
        } catch (_error) {
            toast.error("Failed to create record");
        }
    };

    const handlePay = async (debt: Debt) => {
        const amount = prompt(`Enter amount to pay for ${debt.name}: `, "0");
        if (!amount) return;

        const numAmount = Number(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            toast.error("Invalid amount");
            return;
        }

        if (numAmount > debt.remaining_amount) {
            toast.error("Amount exceeds remaining debt");
            return;
        }

        try {
            await updateDebt.mutateAsync({ id: debt.id, data: { remaining_amount: debt.remaining_amount - numAmount } });
            toast.success("Payment recorded");
        } catch (_error) {
            toast.error("Failed to update debt");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight">Debts & Receivables</h2>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="gap-2">
                            <Plus className="h-4 w-4" /> Add Record
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Debt or Receivable</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Person / Entity Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. John Doe, Bank Loan" {...field} />
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
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="payable">I Owe (Hutang/Cicilan)</SelectItem>
                                                    <SelectItem value="receivable">Owes Me (Piutang)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="amount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Total Amount</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        {...field}
                                                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="remaining_amount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Remaining</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        {...field}
                                                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="due_date"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Due Date (Optional)</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-full pl-3 text-left font-normal",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(field.value, "PPP")
                                                            ) : (
                                                                <span>Pick a date</span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full" disabled={createDebt.isPending}>
                                    Save Record
                                </Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {debts.map((debt) => (
                    <Card key={debt.id} className={debt.remaining_amount === 0 ? "opacity-60" : ""}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {debt.name}
                            </CardTitle>
                            {debt.type === 'payable' ?
                                <ArrowUpRight className="h-4 w-4 text-red-500" /> :
                                <ArrowDownLeft className="h-4 w-4 text-green-500" />
                            }
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="text-2xl font-bold">{formatCurrency(debt.remaining_amount)}</div>
                                    <p className="text-xs text-muted-foreground">
                                        of {formatCurrency(debt.amount)}
                                    </p>
                                </div>
                                {debt.remaining_amount > 0 && (
                                    <Button size="sm" variant="outline" onClick={() => handlePay(debt)}>
                                        Record Payment
                                    </Button>
                                )}
                            </div>
                            {debt.due_date && (
                                <p className="text-xs text-muted-foreground mt-2">
                                    Due: {format(new Date(debt.due_date), 'PP')}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
