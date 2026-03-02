import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FileText } from 'lucide-react';

interface ReportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onGenerate: (options: { includeAll: boolean }) => void;
}

export function ReportDialog({ open, onOpenChange, onGenerate }: ReportDialogProps) {
    const [includeAll, setIncludeAll] = useState(false);

    const handleGenerate = () => {
        onGenerate({ includeAll });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Generate Shopping Report</DialogTitle>
                    <DialogDescription>
                        Create a PDF report of items that need restocking.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="include-all"
                            checked={includeAll}
                            onCheckedChange={(checked) => setIncludeAll(checked as boolean)}
                        />
                        <Label htmlFor="include-all">Include all items (not just low stock)</Label>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleGenerate} className="w-full sm:w-auto">
                        <FileText className="mr-2 h-4 w-4" />
                        Generate PDF
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
