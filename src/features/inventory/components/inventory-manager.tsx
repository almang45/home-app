import { useState, useEffect } from 'react';
import pb from '@/lib/pocketbase';
import { formatCurrency } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import {
    Package,
    Plus,
    FileText,
    ShoppingCart,
    MapPin,
    Tag,
    History,
    Search,
    Edit
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InventoryForm } from './inventory-form';
import { ReportDialog } from './report-dialog';
import { Button } from '@/components/ui/button';
import { PurchaseModal } from './purchase-modal';
import { BulkAddDialog } from './bulk-add-dialog';

// --- Interfaces for Type Safety ---

interface Location {
    name: string;
}

interface InventoryItem {
    id: string;
    collectionId: string;
    collectionName: string;
    created: string;
    updated: string;
    name: string;
    brand: string;
    category: string;
    current_stock: number;
    min_threshold: number;
    last_price: number;
    expand?: {
        stored_in?: Location;
        category?: { name: string };
    };
}

export default function InventoryManager() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');

    // Modal States
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
    const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [purchaseItem, setPurchaseItem] = useState<InventoryItem | null>(null);

    // Fetch items with their location expanded
    const fetchInventory = async () => {
        try {
            const records = await pb.collection('items_inventory').getFullList<InventoryItem>({
                sort: 'name',
                expand: 'stored_in,category',
            });
            setItems(records);
            setLoading(false);
        } catch (err) {
            console.error("Error loading inventory:", err);
            // Fallback for preview if no backend is running
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    // --- FEATURE: GENERATE PDF REPORT ---
    const handleGenerateReport = async ({ includeAll }: { includeAll: boolean }) => {
        const doc = new jsPDF();

        // 1. Filter items
        let reportItems = items;
        if (!includeAll) {
            reportItems = items.filter(i => i.current_stock <= i.min_threshold);
        }

        if (reportItems.length === 0) {
            alert("No items to report!");
            return;
        }

        // 2. Prepare Data for PDF
        const tableRows = reportItems.map(item => [
            item.name,
            item.brand || '-',
            item.expand?.stored_in?.name || 'Unassigned',
            `${item.current_stock} / ${item.min_threshold}`,
            item.last_price ? formatCurrency(item.last_price) : 'N/A'
        ]);

        // 3. Design PDF
        doc.setFontSize(18);
        doc.text("HomeOS Shopping List", 14, 22);

        doc.setFontSize(11);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 30);
        doc.text(`Items listed: ${reportItems.length}`, 14, 36);

        autoTable(doc, {
            startY: 40,
            head: [['Item Name', 'Brand', 'Location', 'Stock/Goal', 'Est. Price']],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185] },
        });

        // 4. Download
        doc.save(`shopping_list_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    // --- LOGIC: RESTOCK ITEM ---
    // --- LOGIC: RESTOCK ITEM ---
    const handleRestock = (item: InventoryItem) => {
        setPurchaseItem(item);
        setIsPurchaseOpen(true);
    };

    const handleConsume = async (id: string, current: number) => {
        if (current > 0) {
            try {
                await pb.collection('items_inventory').update(id, { current_stock: current - 1 });
                fetchInventory();
            } catch (err) {
                console.error("Error updating stock:", err);
            }
        }
    };

    const handleEdit = (item: InventoryItem) => {
        setEditingItem(item);
        setIsAddOpen(true);
    };

    const handleAdd = () => {
        setEditingItem(null);
        setIsAddOpen(true);
    };

    // Filter Logic
    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.brand.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || item.expand?.category?.name === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const categories = Array.from(new Set(items.map(i => i.expand?.category?.name).filter(Boolean))) as string[];

    if (loading) return <div className="p-8 text-center text-slate-500">Loading Inventory...</div>;

    return (
        <div className="p-4 sm:p-6 bg-background min-h-screen">

            {/* Header Actions */}
            <div className="flex flex-col gap-6 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold dark:text-white flex items-center gap-2">
                            <Package /> Inventory
                        </h1>
                        <p className="text-slate-500">Track groceries and home supplies</p>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                            onClick={() => setIsReportOpen(true)}
                            className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700"
                        >
                            <FileText size={18} className="mr-2" />
                            PDF Report
                        </Button>
                        <Button
                            onClick={() => setIsBulkAddOpen(true)}
                            className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700"
                        >
                            <Plus size={18} className="mr-2" />
                            Bulk Add
                        </Button>
                        <Button
                            onClick={handleAdd}
                            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus size={18} className="mr-2" />
                            Add Item
                        </Button>
                    </div>
                </div>

                {/* Search and Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-4 bg-background p-4 rounded-xl shadow-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input
                            placeholder="Search items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Inventory Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredItems.length === 0 && (
                    <div className="col-span-full text-center py-10 text-muted-foreground bg-background rounded-xl border border-dashed border-border">
                        <p>No inventory items found.</p>
                        <p className="text-sm mt-1">Add items to get started.</p>
                    </div>
                )}

                {filteredItems.map((item) => {
                    const isLowStock = item.current_stock <= item.min_threshold;

                    return (
                        <div
                            key={item.id}
                            className={`bg-background rounded-xl border-l-4 shadow-sm p-4 relative group ${isLowStock ? 'border-l-destructive' : 'border-l-green-500'
                                }`}
                        >
                            {/* Edit Button (Visible on Hover) */}
                            <button
                                onClick={() => handleEdit(item)}
                                className="absolute top-2 right-2 p-2 text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Edit size={16} />
                            </button>

                            {/* Badge for Low Stock */}
                            {isLowStock && (
                                <span className="absolute top-4 right-8 bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                                    LOW STOCK
                                </span>
                            )}

                            <div className="mb-3 pr-8">
                                <h3 className="font-bold text-lg dark:text-white truncate" title={item.name}>{item.name}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{item.brand}</p>
                            </div>

                            <div className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300 mb-4">
                                <div className="flex items-center gap-2">
                                    <Tag size={14} />
                                    <span>{item.expand?.category?.name || 'Uncategorized'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin size={14} />
                                    <span>{item.expand?.stored_in?.name || 'No Location'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <History size={14} />
                                    <span>Last Price: {item.last_price ? formatCurrency(item.last_price) : '-'}</span>
                                </div>
                            </div>

                            {/* Stock Controls */}
                            <div className="flex items-center justify-between bg-muted rounded-lg p-2">
                                <button
                                    onClick={() => handleConsume(item.id, item.current_stock)}
                                    className="w-8 h-8 flex items-center justify-center bg-background rounded shadow-sm hover:text-destructive disabled:opacity-50"
                                    disabled={item.current_stock <= 0}
                                >
                                    -
                                </button>
                                <div className="text-center">
                                    <span className={`block font-bold text-lg ${isLowStock ? 'text-red-600' : 'text-slate-800 dark:text-white'}`}>
                                        {item.current_stock}
                                    </span>
                                    <span className="text-[10px] text-slate-500 uppercase">In Stock</span>
                                </div>
                                <button
                                    onClick={() => handleRestock(item)}
                                    className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded shadow-sm hover:bg-blue-700"
                                >
                                    <ShoppingCart size={14} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modals */}
            <InventoryForm
                open={isAddOpen}
                onOpenChange={setIsAddOpen}
                initialData={editingItem}
                onSuccess={fetchInventory}
            />

            <BulkAddDialog
                open={isBulkAddOpen}
                onOpenChange={setIsBulkAddOpen}
                onSuccess={fetchInventory}
            />

            <ReportDialog
                open={isReportOpen}
                onOpenChange={setIsReportOpen}
                onGenerate={handleGenerateReport}
            />

            <PurchaseModal
                open={isPurchaseOpen}
                onOpenChange={setIsPurchaseOpen}
                item={purchaseItem}
                onSuccess={() => {
                    fetchInventory();
                    alert("Restocked successfully!");
                }}
            />
        </div>
    );
}
