import { useForm } from 'react-hook-form';
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

const formSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    brand: z.string().optional(),
    category: z.string().optional(),
    current_stock: z.coerce.number().min(0),
    min_threshold: z.coerce.number().min(0),
    last_price: z.coerce.number().min(0).optional(),
    location_name: z.string().optional(),
});

interface InventoryFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: any;
    onSuccess: () => void;
}

export function InventoryForm({ open, onOpenChange, initialData, onSuccess }: InventoryFormProps) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            name: '',
            brand: '',
            category: '',
            current_stock: 0,
            min_threshold: 1,
            last_price: 0,
            location_name: '',
        },
    });

    const [categories, setCategories] = useState<{ label: string; value: string }[]>([]);
    const [locations, setLocations] = useState<{ label: string; value: string }[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Categories (from dedicated collection)
                const catItems = await pb.collection('items_categories').getFullList({ sort: 'name' });
                setCategories(catItems.map(c => ({ label: c.name, value: c.id })));

                // Fetch Locations
                const locs = await pb.collection('items_locations').getFullList({ sort: 'name' });
                setLocations(locs.map(l => ({ label: l.name, value: l.name })));
            } catch (err) {
                console.error("Error fetching form options:", err);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (initialData) {
            form.reset({
                name: initialData.name,
                brand: initialData.brand,
                category: initialData.category, // Assuming this is the ID
                current_stock: initialData.current_stock,
                min_threshold: initialData.min_threshold,
                last_price: initialData.last_price,
                location_name: initialData.expand?.stored_in?.name || '',
            });
        } else {
            form.reset({
                name: '',
                brand: '',
                category: '',
                current_stock: 0,
                min_threshold: 1,
                last_price: 0,
                location_name: '',
            });
        }
    }, [initialData, form, open]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            let locationId = null;
            if (values.location_name) {
                // Try to find existing location or create new one
                try {
                    const existingLoc = await pb.collection('items_locations').getFirstListItem(`name="${values.location_name}"`);
                    locationId = existingLoc.id;
                } catch {
                    const newLoc = await pb.collection('items_locations').create({ name: values.location_name });
                    locationId = newLoc.id;
                }
            }

            let categoryId = values.category;
            if (values.category) {
                // Check if the value corresponds to an existing category ID
                const isExistingId = categories.some(c => c.value === values.category);

                if (!isExistingId) {
                    // It's a new category name (custom input)
                    try {
                        // Check if it exists by name first
                        const existingCat = await pb.collection('items_categories').getFirstListItem(`name="${values.category}"`);
                        categoryId = existingCat.id;
                    } catch {
                        // Create new category
                        const newCat = await pb.collection('items_categories').create({ name: values.category });
                        categoryId = newCat.id;
                    }
                }
            }

            const data = {
                ...values,
                category: categoryId,
                stored_in: locationId,
            };

            if (initialData) {
                await pb.collection('items_inventory').update(initialData.id, data);
            } else {
                await pb.collection('items_inventory').create(data);
            }
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error('Error saving item:', error);
            alert('Failed to save item');
        }
    };

    const handleDelete = async () => {
        if (!initialData) return;
        if (confirm('Are you sure you want to delete this item?')) {
            try {
                await pb.collection('items_inventory').delete(initialData.id);
                onSuccess();
                onOpenChange(false);
            } catch (error) {
                console.error('Error deleting item:', error);
                alert('Failed to delete item');
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Edit Item' : 'Add New Item'}</DialogTitle>
                    <DialogDescription>
                        {initialData ? 'Update item details below.' : 'Enter the details for the new inventory item.'}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Item name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="brand"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Brand</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Brand" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Category</FormLabel>
                                        <FormControl>
                                            <Combobox
                                                options={categories}
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="Select category"
                                                allowCustom
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="current_stock"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Current Stock</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="min_threshold"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Min Threshold</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="last_price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Last Price</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="location_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Location</FormLabel>
                                        <FormControl>
                                            <Combobox
                                                options={locations}
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="Select location"
                                                allowCustom
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            {initialData && (
                                <Button type="button" variant="destructive" onClick={handleDelete}>
                                    Delete
                                </Button>
                            )}
                            <Button type="submit">Save changes</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
