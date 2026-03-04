import { useForm, type Resolver } from 'react-hook-form';
import { logger } from '@/lib/logger';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
import { Button } from '@/components/ui/button';
import pb from '@/lib/pocketbase';
import { useEffect } from 'react';

const formSchema = z.object({
    price: z.coerce.number().min(0, 'Price must be positive'),
    store_name: z.string().min(1, 'Store name is required'),
    quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
});

interface PurchaseModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: { id: string; name: string; current_stock: number; last_price?: number } | null;
    onSuccess: () => void;
}

export function PurchaseModal({ open, onOpenChange, item, onSuccess }: PurchaseModalProps) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as Resolver<z.infer<typeof formSchema>>,
        defaultValues: {
            price: 0,
            store_name: 'Pasar',
            quantity: 1,
        },
    });

    useEffect(() => {
        if (item) {
            form.reset({
                price: item.last_price || 0,
                store_name: 'Pasar',
                quantity: 1,
            });
        }
    }, [item, form, open]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!item) return;

        try {
            // 1. Create Purchase Record
            await pb.collection('items_purchases').create({
                item: item.id,
                price: values.price,
                store_name: values.store_name,
                quantity: values.quantity,
                buy_date: new Date(),
            });

            // 2. Update Inventory Stock & Last Price
            await pb.collection('items_inventory').update(item.id, {
                current_stock: item.current_stock + values.quantity,
                last_price: values.price
            });

            onSuccess();
            onOpenChange(false);
        } catch (error) {
            logger.error('Error processing purchase:', error);
            alert('Failed to process purchase');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Restock Item</DialogTitle>
                    <DialogDescription>
                        Add stock for <strong>{item?.name}</strong>.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="store_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Store</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Store Name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Price Paid</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Quantity</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit">Confirm Purchase</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
