import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, Save } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

import { transactionSchema } from '../data/schema';
import { useSources, useCategories, useSubcategories, useCreateBulkTransactions } from '../data/queries';

const bulkTransactionSchema = z.object({
    transactions: z.array(transactionSchema)
});

type BulkTransactionFormValues = z.infer<typeof bulkTransactionSchema>;

interface BulkTransactionFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function BulkTransactionForm({ open, onOpenChange }: BulkTransactionFormProps) {
    const { data: sources = [] } = useSources();
    const { data: categories = [] } = useCategories();
    const { data: subcategories = [] } = useSubcategories();
    const createBulkTransactions = useCreateBulkTransactions();

    const form = useForm<BulkTransactionFormValues>({
        resolver: zodResolver(bulkTransactionSchema) as any,
        defaultValues: {
            transactions: [
                {
                    amount: 0,
                    type: 'expense',
                    category: '',
                    subcategory: '',
                    date: new Date(),
                    description: '',
                    source_id: '',
                }
            ]
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "transactions",
    });

    useEffect(() => {
        if (open) {
            form.reset({
                transactions: [
                    {
                        amount: 0,
                        type: 'expense',
                        category: '',
                        subcategory: '',
                        date: new Date(),
                        description: '',
                        source_id: '',
                    }
                ]
            });
        }
    }, [open, form]);

    const onSubmit = async (data: BulkTransactionFormValues) => {
        try {
            await createBulkTransactions.mutateAsync(data.transactions);
            toast.success(`Logged ${data.transactions.length} transactions`);
            onOpenChange(false);
            form.reset();
        } catch (error) {
            toast.error("Failed to log transactions");
        }
    };

    const getFilteredCategories = (type: string) => {
        return categories.filter(c => c.type === type);
    };

    const getFilteredSubcategories = (categoryId: string) => {
        return subcategories.filter(s => s.category_id === categoryId);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[1000px] w-full">
                <DialogHeader>
                    <DialogTitle>Bulk Add Transactions</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="max-h-[60vh] overflow-y-auto pr-2">
                            <div className="space-y-2">
                                {/* Header Row */}
                                <div className="flex gap-2 font-medium text-sm text-muted-foreground px-1 mb-2">
                                    <div className="w-[110px]">Date</div>
                                    <div className="w-[100px]">Type</div>
                                    <div className="w-[140px]">Category</div>
                                    <div className="w-[140px]">Subcategory</div>
                                    <div className="w-[100px]">Amount</div>
                                    <div className="w-[140px]">Source</div>
                                    <div className="flex-1">Description</div>
                                    <div className="w-[40px]"></div>
                                </div>

                                {fields.map((field, index) => {
                                    const currentType = form.watch(`transactions.${index}.type`);
                                    const currentCategory = form.watch(`transactions.${index}.category`);

                                    return (
                                        <div key={field.id} className="flex gap-2 items-start">
                                            {/* Date */}
                                            <FormField
                                                control={form.control}
                                                name={`transactions.${index}.date`}
                                                render={({ field }) => (
                                                    <FormItem className="w-[110px]">
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <FormControl>
                                                                    <Button
                                                                        variant={"outline"}
                                                                        className={cn(
                                                                            "w-full pl-2 text-left font-normal h-10 px-2 text-xs",
                                                                            !field.value && "text-muted-foreground"
                                                                        )}
                                                                    >
                                                                        {field.value ? (
                                                                            format(field.value, "MMM d")
                                                                        ) : (
                                                                            <span>Pick date</span>
                                                                        )}
                                                                    </Button>
                                                                </FormControl>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto p-0" align="start">
                                                                <Calendar
                                                                    mode="single"
                                                                    selected={field.value}
                                                                    onSelect={field.onChange}
                                                                    disabled={(date) =>
                                                                        date > new Date() || date < new Date("1900-01-01")
                                                                    }
                                                                    initialFocus
                                                                />
                                                            </PopoverContent>
                                                        </Popover>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Type */}
                                            <FormField
                                                control={form.control}
                                                name={`transactions.${index}.type`}
                                                render={({ field }) => (
                                                    <FormItem className="w-[100px]">
                                                        <Select onValueChange={(val) => {
                                                            field.onChange(val);
                                                            form.setValue(`transactions.${index}.category`, '');
                                                            form.setValue(`transactions.${index}.subcategory`, '');
                                                        }} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className="h-10 px-2 text-xs">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="expense">Expense</SelectItem>
                                                                <SelectItem value="income">Income</SelectItem>
                                                                <SelectItem value="transfer">Transfer</SelectItem>
                                                                <SelectItem value="debt_repayment">Debt</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Category */}
                                            <FormField
                                                control={form.control}
                                                name={`transactions.${index}.category`}
                                                render={({ field }) => (
                                                    <FormItem className="w-[140px]">
                                                        <Select onValueChange={(val) => {
                                                            field.onChange(val);
                                                            form.setValue(`transactions.${index}.subcategory`, '');
                                                        }} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className="h-10 px-2 text-xs">
                                                                    <SelectValue placeholder="Category" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {getFilteredCategories(currentType).map(cat => (
                                                                    <SelectItem key={cat.id} value={cat.id}>
                                                                        {cat.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Subcategory */}
                                            <FormField
                                                control={form.control}
                                                name={`transactions.${index}.subcategory`}
                                                render={({ field }) => (
                                                    <FormItem className="w-[140px]">
                                                        <Select onValueChange={field.onChange} value={field.value || ''}>
                                                            <FormControl>
                                                                <SelectTrigger className="h-10 px-2 text-xs">
                                                                    <SelectValue placeholder="Sub (Opt)" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {getFilteredSubcategories(currentCategory).map(sub => (
                                                                    <SelectItem key={sub.id} value={sub.id}>
                                                                        {sub.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Amount */}
                                            <FormField
                                                control={form.control}
                                                name={`transactions.${index}.amount`}
                                                render={({ field }) => (
                                                    <FormItem className="w-[100px]">
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                className="h-10 px-2 text-xs"
                                                                {...field}
                                                                onChange={e => field.onChange(e.target.valueAsNumber)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Source */}
                                            <FormField
                                                control={form.control}
                                                name={`transactions.${index}.source_id`}
                                                render={({ field }) => (
                                                    <FormItem className="w-[140px]">
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className="h-10 px-2 text-xs">
                                                                    <SelectValue placeholder="Source" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {sources.map(source => (
                                                                    <SelectItem key={source.id} value={source.id}>
                                                                        {source.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Description */}
                                            <FormField
                                                control={form.control}
                                                name={`transactions.${index}.description`}
                                                render={({ field }) => (
                                                    <FormItem className="flex-1">
                                                        <FormControl>
                                                            <Input className="h-10 px-2 text-xs" {...field} placeholder="Desc" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Remove Button */}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 text-destructive"
                                                onClick={() => remove(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <DialogFooter className="flex justify-between sm:justify-between">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => append({
                                    amount: 0,
                                    type: 'expense',
                                    category: '',
                                    subcategory: '',
                                    date: new Date(),
                                    description: '',
                                    source_id: sources[0]?.id || '',
                                })}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Row
                            </Button>
                            <Button type="submit" disabled={createBulkTransactions.isPending}>
                                <Save className="mr-2 h-4 w-4" />
                                Save All
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
