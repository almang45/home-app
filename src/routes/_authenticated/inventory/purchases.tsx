import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useRef } from 'react';
import { useForm, useFieldArray, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import pb from '@/lib/pocketbase';
import { parseReceiptImage } from '@/lib/claude-ai';
import { logger } from '@/lib/logger';
import { formatCurrency } from '@/lib/utils';
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
import { Combobox } from '@/components/ui/combobox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, ShoppingCart, Calendar, Store, ChevronDown, ScanLine, Loader2 } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/inventory/purchases')({
    component: PurchasesPage,
});

// --- SCHEMAS ---

const purchaseItemSchema = z.object({
    item_id: z.string().optional(), // Optional because scanned items might not match inventory yet
    name: z.string().optional(), // For scanned items
    quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
    price: z.coerce.number().min(0, 'Price must be positive'),
});

const purchaseFormSchema = z.object({
    store_name: z.string().min(1, 'Store name is required'),
    buy_date: z.string().min(1, 'Date is required'), // YYYY-MM-DD
    items: z.array(purchaseItemSchema).min(1, "Add at least one item"),
});

// --- INTERFACES ---

interface PurchaseRecord {
    id: string;
    price: number;
    quantity: number;
    store_name: string;
    buy_date: string;
    group_id: string;
    expand?: { item?: { name: string } };
}

interface PurchaseGroup {
    group_id: string;
    store_name: string;
    buy_date: string;
    total_amount: number;
    items: PurchaseRecord[];
}

interface ScannedItem {
    name: string;
    quantity: number;
    price: number;
}

// --- HELPER ---
const generateGroupId = (storeName: string, dateStr: string) => {
    const cleanStore = storeName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
    const randomSuffix = Math.random().toString(36).substring(2, 10);
    return `${dateStr.replace(/-/g, '_')}_${cleanStore}_${randomSuffix}`;
};

function PurchasesPage() {
    const [activeTab, setActiveTab] = useState('new');
    const [inventoryItems, setInventoryItems] = useState<{ label: string; value: string; last_price: number }[]>([]);
    const [purchaseHistory, setPurchaseHistory] = useState<PurchaseGroup[]>([]); // Grouped history
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- FORM SETUP ---
    const form = useForm<z.infer<typeof purchaseFormSchema>>({
        resolver: zodResolver(purchaseFormSchema) as Resolver<z.infer<typeof purchaseFormSchema>>,
        defaultValues: {
            store_name: '',
            buy_date: format(new Date(), 'yyyy-MM-dd'),
            items: [{ item_id: '', quantity: 1, price: 0 }],
        },
    });

    const { fields, append, remove, replace } = useFieldArray({
        control: form.control,
        name: "items",
    });

    // --- DATA FETCHING ---
    useEffect(() => {
        // Fetch Inventory for Combobox
        const fetchInventory = async () => {
            try {
                const records = await pb.collection('items_inventory').getFullList({
                    sort: 'name',
                    fields: 'id,name,brand,last_price',
                });
                setInventoryItems(records.map(i => ({
                    label: `${i.name} ${i.brand ? `(${i.brand})` : ''}`,
                    value: i.id,
                    last_price: i.last_price
                })));
            } catch (err) {
                logger.error("Error fetching inventory:", err);
            }
        };
        fetchInventory();
    }, []);

    const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
            const records = await pb.collection('items_purchases').getFullList<PurchaseRecord>({
                sort: '-buy_date',
                expand: 'item',
            });

            // Group by group_id
            const grouped = records.reduce((acc: Record<string, PurchaseGroup>, record) => {
                const gid = record.group_id || `legacy_${record.id}`;
                if (!acc[gid]) {
                    acc[gid] = {
                        group_id: gid,
                        store_name: record.store_name,
                        buy_date: record.buy_date,
                        total_amount: 0,
                        items: []
                    };
                }
                acc[gid].items.push(record);
                acc[gid].total_amount += (record.price * record.quantity);
                return acc;
            }, {});

            setPurchaseHistory(Object.values(grouped).sort((a, b) => new Date(b.buy_date).getTime() - new Date(a.buy_date).getTime()));
        } catch (err) {
            logger.error("Error fetching history:", err);
        } finally {
            setLoadingHistory(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'history') {
            fetchHistory();
        }
    }, [activeTab]);

    // --- HANDLERS ---

    const handleItemSelect = (index: number, itemId: string) => {
        const item = inventoryItems.find(i => i.value === itemId);
        if (item) {
            form.setValue(`items.${index}.price`, item.last_price || 0);
        }
    };

    const handleScanClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsScanning(true);
        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = reader.result as string;
                try {
                    const data = await parseReceiptImage(base64String);

                    // Populate form
                    form.setValue('store_name', data.store_name);
                    form.setValue('buy_date', data.buy_date);

                    // Map items
                    // Try to match with existing inventory by name
                    const mappedItems = data.items.map((scannedItem: ScannedItem) => {
                        const match = inventoryItems.find(i =>
                            i.label.toLowerCase().includes(scannedItem.name.toLowerCase())
                        );
                        return {
                            item_id: match ? match.value : '', // Auto-select if match found
                            name: scannedItem.name, // Keep scanned name for reference if no match
                            quantity: scannedItem.quantity || 1,
                            price: scannedItem.price || 0,
                        };
                    });

                    replace(mappedItems);
                    alert("Receipt scanned! Please review the items.");
                } catch (err) {
                    logger.error("Receipt scan error:", err);
                    alert("Failed to parse receipt. Please try again.");
                } finally {
                    setIsScanning(false);
                }
            };
            reader.readAsDataURL(file);
        } catch (error) {
            logger.error("File Error:", error);
            setIsScanning(false);
        }

        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const onSubmit = async (values: z.infer<typeof purchaseFormSchema>) => {
        try {
            // Validate that all items have an item_id selected
            const invalidItems = values.items.filter(i => !i.item_id);
            if (invalidItems.length > 0) {
                alert("Please select an Inventory Item for all scanned items.");
                return;
            }

            const groupId = generateGroupId(values.store_name, values.buy_date);
            const user = pb.authStore.model?.id;

            // Process sequentially
            for (const item of values.items) {
                if (!item.item_id) continue; // Should be caught by validation above

                // 1. Create Purchase Record
                await pb.collection('items_purchases').create({
                    item: item.item_id,
                    price: item.price,
                    quantity: item.quantity,
                    store_name: values.store_name,
                    buy_date: new Date(values.buy_date),
                    group_id: groupId,
                    user: user,
                });

                // 2. Update Inventory
                const currentItem = await pb.collection('items_inventory').getOne(item.item_id);
                await pb.collection('items_inventory').update(item.item_id, {
                    current_stock: currentItem.current_stock + item.quantity,
                    last_price: item.price
                });
            }

            alert("Purchases recorded successfully!");
            form.reset({
                store_name: '',
                buy_date: format(new Date(), 'yyyy-MM-dd'),
                items: [{ item_id: '', quantity: 1, price: 0 }],
            });
            setActiveTab('history'); // Switch to history to show it
        } catch (error) {
            logger.error('Error recording purchases:', error);
            alert('Failed to record purchases');
        }
    };

    return (
        <div className="p-4 sm:p-6 bg-background min-h-screen">
            <div className="mb-6">
                <h1 className="text-2xl font-bold dark:text-white flex items-center gap-2">
                    <ShoppingCart /> Purchases
                </h1>
                <p className="text-slate-500">Record shopping trips and view history</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-6">
                    <TabsTrigger value="new">New Purchase</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="new">
                    <div className="bg-background p-6 rounded-xl shadow-sm border border-border">

                        {/* Scan Receipt Button */}
                        <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center gap-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleScanClick}
                                disabled={isScanning}
                                className="w-full sm:w-auto"
                            >
                                {isScanning ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scanning Receipt...
                                    </>
                                ) : (
                                    <>
                                        <ScanLine className="mr-2 h-4 w-4" /> Scan Receipt with AI
                                    </>
                                )}
                            </Button>
                            <p className="text-xs text-slate-500">Upload a receipt image to auto-fill the form</p>
                        </div>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="store_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Store Name</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                        <Input placeholder="e.g. Walmart, Costco" className="pl-10" {...field} />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="buy_date"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Date</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                        <Input type="date" className="pl-10" {...field} />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-lg">Items</h3>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => append({ item_id: '', quantity: 1, price: 0 })}
                                        >
                                            <Plus className="mr-2 h-4 w-4" /> Add Item
                                        </Button>
                                    </div>

                                    {fields.map((field, index) => (
                                        <div key={field.id} className="flex gap-4 items-start p-4 border rounded-lg bg-muted">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                                                <FormField
                                                    control={form.control}
                                                    name={`items.${index}.item_id`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className={index !== 0 ? "sr-only" : ""}>Item</FormLabel>
                                                            <FormControl>
                                                                <div className="space-y-1">
                                                                    <Combobox
                                                                        options={inventoryItems}
                                                                        value={field.value}
                                                                        onChange={(val) => {
                                                                            field.onChange(val);
                                                                            handleItemSelect(index, val);
                                                                        }}
                                                                        placeholder="Select Item"
                                                                    />
                                                                    {/* Show scanned name if no item selected */}
                                                                    {!field.value && (form.getValues(`items.${index}.name`)) && (
                                                                        <p className="text-xs text-amber-600">
                                                                            Scanned: {form.getValues(`items.${index}.name`)}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`items.${index}.quantity`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className={index !== 0 ? "sr-only" : ""}>Qty</FormLabel>
                                                            <FormControl>
                                                                <Input type="number" min="1" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`items.${index}.price`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className={index !== 0 ? "sr-only" : ""}>Price (Each)</FormLabel>
                                                            <FormControl>
                                                                <Input type="number" step="0.01" {...field} />
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

                                <div className="flex justify-end pt-4">
                                    <Button type="submit" size="lg" className="w-full md:w-auto">
                                        Record Purchase
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </div>
                </TabsContent>

                <TabsContent value="history">
                    <div className="bg-background rounded-xl shadow-sm border border-border overflow-hidden">
                        {loadingHistory ? (
                            <div className="p-8 text-center text-slate-500">Loading History...</div>
                        ) : purchaseHistory.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">No purchase history found.</div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {purchaseHistory.map((group) => (
                                    <Collapsible key={group.group_id} className="border rounded-lg bg-background">
                                        <CollapsibleTrigger className="flex flex-col sm:flex-row sm:items-center justify-between w-full p-4 hover:bg-muted rounded-t-lg transition-colors [&[data-state=open]>div>svg]:rotate-180">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2 text-slate-500">
                                                    <Calendar size={16} />
                                                    <span>{format(new Date(group.buy_date), 'MMM dd, yyyy')}</span>
                                                </div>
                                                <div className="flex items-center gap-2 font-semibold">
                                                    <Store size={16} />
                                                    <span>{group.store_name}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm text-slate-500">{group.items.length} items</span>
                                                <span className="font-bold text-green-600">
                                                    {formatCurrency(group.total_amount)}
                                                </span>
                                                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                                            </div>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent className="px-4 pb-4 pt-0">
                                            <div className="text-xs text-slate-400 mb-2 font-mono mt-2">ID: {group.group_id}</div>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Item</TableHead>
                                                        <TableHead className="text-right">Qty</TableHead>
                                                        <TableHead className="text-right">Price</TableHead>
                                                        <TableHead className="text-right">Total</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {group.items.map((item: PurchaseRecord) => (
                                                        <TableRow key={item.id}>
                                                            <TableCell className="font-medium">
                                                                {item.expand?.item?.name || 'Unknown Item'}
                                                            </TableCell>
                                                            <TableCell className="text-right">{item.quantity}</TableCell>
                                                            <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                                                            <TableCell className="text-right font-semibold">
                                                                {formatCurrency(item.price * item.quantity)}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </CollapsibleContent>
                                    </Collapsible>
                                ))}
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
