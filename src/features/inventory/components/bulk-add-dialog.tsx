import { useForm, useFieldArray, type Resolver } from 'react-hook-form';
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
import { useEffect, useState } from 'react';
import pb from '@/lib/pocketbase';
import { Combobox } from '@/components/ui/combobox';
import { Plus, Trash2 } from 'lucide-react';

const itemSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    brand: z.string().optional(),
    category: z.string().optional(),
    current_stock: z.coerce.number().min(0),
    min_threshold: z.coerce.number().min(0),
    last_price: z.coerce.number().min(0).optional(),
    location_name: z.string().optional(),
});

const formSchema = z.object({
    items: z.array(itemSchema).min(1, "Add at least one item"),
});

interface BulkAddDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function BulkAddDialog({ open, onOpenChange, onSuccess }: BulkAddDialogProps) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as Resolver<z.infer<typeof formSchema>>,
        defaultValues: {
            items: [
                {
                    name: '',
                    brand: '',
                    category: '',
                    current_stock: 0,
                    min_threshold: 1,
                    last_price: 0,
                    location_name: '',
                }
            ],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

    const [categories, setCategories] = useState<{ label: string; value: string }[]>([]);
    const [locations, setLocations] = useState<{ label: string; value: string }[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Categories
                const catItems = await pb.collection('items_categories').getFullList({ sort: 'name' });
                setCategories(catItems.map(c => ({ label: c.name, value: c.id })));

                // Fetch Locations
                const locs = await pb.collection('items_locations').getFullList({ sort: 'name' });
                setLocations(locs.map(l => ({ label: l.name, value: l.name })));
            } catch (err) {
                logger.error("Error fetching form options:", err);
            }
        };
        fetchData();
    }, []);

    // Reset form when dialog opens
    useEffect(() => {
        if (open) {
            form.reset({
                items: [
                    {
                        name: '',
                        brand: '',
                        category: '',
                        current_stock: 0,
                        min_threshold: 1,
                        last_price: 0,
                        location_name: '',
                    }
                ],
            });
        }
    }, [open, form]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            // Process each item sequentially to handle location creation correctly
            for (const item of values.items) {
                let locationId = null;
                if (item.location_name) {
                    try {
                        const existingLoc = await pb.collection('items_locations').getFirstListItem(`name="${item.location_name}"`);
                        locationId = existingLoc.id;
                    } catch {
                        const newLoc = await pb.collection('items_locations').create({ name: item.location_name });
                        locationId = newLoc.id;
                    }
                }

                let categoryId = item.category;
                if (item.category) {
                    // Check if the value corresponds to an existing category ID
                    const isExistingId = categories.some(c => c.value === item.category);

                    if (!isExistingId) {
                        // It's a new category name (custom input)
                        try {
                            // Check if it exists by name first
                            const existingCat = await pb.collection('items_categories').getFirstListItem(`name="${item.category}"`);
                            categoryId = existingCat.id;
                        } catch {
                            // Create new category
                            const newCat = await pb.collection('items_categories').create({ name: item.category });
                            categoryId = newCat.id;
                        }
                    }
                }

                const data = {
                    ...item,
                    category: categoryId,
                    stored_in: locationId,
                };

                await pb.collection('items_inventory').create(data);
            }

            onSuccess();
            onOpenChange(false);
        } catch (error) {
            logger.error('Error saving items:', error);
            alert('Failed to save items');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Bulk Add Items</DialogTitle>
                    <DialogDescription>
                        Add multiple items to your inventory at once.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-4">
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex gap-4 items-start p-4 border rounded-lg bg-muted">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.name`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className={index !== 0 ? "sr-only" : ""}>Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Item Name" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.brand`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className={index !== 0 ? "sr-only" : ""}>Brand</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Brand" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.category`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className={index !== 0 ? "sr-only" : ""}>Category</FormLabel>
                                                    <FormControl>
                                                        <Combobox
                                                            options={categories}
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                            placeholder="Category"
                                                            allowCustom
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.current_stock`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className={index !== 0 ? "sr-only" : ""}>Stock</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" placeholder="Stock" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.min_threshold`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className={index !== 0 ? "sr-only" : ""}>Min</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" placeholder="Min" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.last_price`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className={index !== 0 ? "sr-only" : ""}>Price</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" step="0.01" placeholder="Price" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.location_name`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className={index !== 0 ? "sr-only" : ""}>Location</FormLabel>
                                                    <FormControl>
                                                        <Combobox
                                                            options={locations}
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                            placeholder="Location"
                                                            allowCustom
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className={`mt-2 ${index === 0 ? "mt-8" : ""}`}
                                        onClick={() => remove(index)}
                                        disabled={fields.length === 1}
                                    >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full border-dashed"
                            onClick={() => append({
                                name: '',
                                brand: '',
                                category: '',
                                current_stock: 0,
                                min_threshold: 1,
                                last_price: 0,
                                location_name: '',
                            })}
                        >
                            <Plus className="mr-2 h-4 w-4" /> Add Another Item
                        </Button>

                        <DialogFooter>
                            <Button type="submit">Save All Items</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
