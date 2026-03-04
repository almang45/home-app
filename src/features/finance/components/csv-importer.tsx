import { useState, useRef } from 'react';
import { logger } from '@/lib/logger';
import { FileText, AlertCircle, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency } from '@/lib/utils';
import { Input } from '@/components/ui/input';

import { transactionSchema, type TransactionFormValues } from '../data/schema';
import { useSources, useCategories, useSubcategories, useCreateBulkTransactions } from '../data/queries';

interface CsvImporterProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CsvImporter({ open, onOpenChange }: CsvImporterProps) {
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<TransactionFormValues[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: sources = [] } = useSources();
    const { data: categories = [] } = useCategories();
    const { data: subcategories = [] } = useSubcategories();
    const createBulkTransactions = useCreateBulkTransactions();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setErrors([]);
            setParsedData([]);
        }
    };

    const parseCsv = async () => {
        if (!file) return;

        const text = await file.text();
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        const requiredHeaders = ['date', 'amount', 'type', 'category', 'source'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

        if (missingHeaders.length > 0) {
            setErrors([`Missing required columns: ${missingHeaders.join(', ')}`]);
            return;
        }

        const newTransactions: TransactionFormValues[] = [];
        const newErrors: string[] = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = line.split(',').map(v => v.trim());
            const row: Record<string, string> = {};

            headers.forEach((header, index) => {
                row[header] = values[index];
            });

            const source = sources.find(s => s.name.toLowerCase() === row.source?.toLowerCase());
            if (!source) {
                newErrors.push(`Row ${i + 1}: Source "${row.source}" not found`);
                continue;
            }

            const category = categories.find(c => c.name.toLowerCase() === row.category?.toLowerCase());
            if (!category) {
                newErrors.push(`Row ${i + 1}: Category "${row.category}" not found`);
                continue;
            }

            let subcategoryId: string | undefined = undefined;
            if (row.subcategory) {
                const subcategory = subcategories.find(s =>
                    s.name.toLowerCase() === row.subcategory?.toLowerCase() &&
                    s.category_id === category.id
                );
                if (subcategory) {
                    subcategoryId = subcategory.id;
                } else {
                    logger.warn(`Row ${i + 1}: Subcategory "${row.subcategory}" not found for category "${category.name}"`);
                }
            }

            const transaction = {
                date: new Date(row.date),
                amount: parseFloat(row.amount),
                type: row.type,
                category: category.id,
                subcategory: subcategoryId,
                source_id: source.id,
                description: row.description || '',
            };

            const result = transactionSchema.safeParse(transaction);
            if (result.success) {
                newTransactions.push(result.data as TransactionFormValues);
            } else {
                newErrors.push(`Row ${i + 1}: ${result.error.issues.map(e => e.message).join(', ')}`);
            }
        }

        setParsedData(newTransactions);
        setErrors(newErrors);
    };

    const handleImport = async () => {
        try {
            await createBulkTransactions.mutateAsync(parsedData);
            toast.success(`${parsedData.length} transactions imported`);
            onOpenChange(false);
            setFile(null);
            setParsedData([]);
            setErrors([]);
        } catch (_error) {
            toast.error("Failed to import transactions");
        }
    };

    const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || id;
    const getSubcategoryName = (id?: string) => subcategories.find(s => s.id === id)?.name || '-';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Import Transactions from CSV</DialogTitle>
                    <DialogDescription>
                        Upload a CSV file with columns: date, amount, type, category, subcategory, source, description.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                    {!parsedData.length && (
                        <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-4">
                            <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    Drag and drop your CSV file here, or click to browse
                                </p>
                                <Input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                                    Select File
                                </Button>
                            </div>
                            {file && (
                                <div className="flex items-center justify-center gap-2 text-sm font-medium">
                                    <Check className="h-4 w-4 text-green-500" />
                                    {file.name}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFile(null);
                                            setErrors([]);
                                        }}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            )}
                            {file && (
                                <Button onClick={parseCsv} disabled={!file}>
                                    Preview Data
                                </Button>
                            )}
                        </div>
                    )}

                    {errors.length > 0 && (
                        <Alert variant="destructive" className="max-h-[150px] overflow-y-auto">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Validation Errors</AlertTitle>
                            <AlertDescription>
                                <ul className="list-disc pl-4 space-y-1">
                                    {errors.map((err, i) => (
                                        <li key={i}>{err}</li>
                                    ))}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}

                    {parsedData.length > 0 && (
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-medium">{parsedData.length} Valid Transactions</h3>
                                <Button variant="outline" size="sm" onClick={() => {
                                    setParsedData([]);
                                    setFile(null);
                                }}>
                                    Reset
                                </Button>
                            </div>
                            <ScrollArea className="flex-1 border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Sub</TableHead>
                                            <TableHead>Source</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {parsedData.map((tx, i) => (
                                            <TableRow key={i}>
                                                <TableCell>{format(tx.date, 'dd/MM/yyyy')}</TableCell>
                                                <TableCell>{formatCurrency(tx.amount)}</TableCell>
                                                <TableCell className="capitalize">{getCategoryName(tx.category)}</TableCell>
                                                <TableCell className="capitalize">{getSubcategoryName(tx.subcategory)}</TableCell>
                                                <TableCell>
                                                    {sources.find(s => s.id === tx.source_id)?.name}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </div>
                    )}
                </div>

                {parsedData.length > 0 && (
                    <div className="pt-4 border-t">
                        <Button onClick={handleImport} className="w-full" disabled={createBulkTransactions.isPending}>
                            Import {parsedData.length} Transactions
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
