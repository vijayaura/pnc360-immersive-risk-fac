import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ScanningDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    isUploading: boolean;
}

export const ScanningDialog: React.FC<ScanningDialogProps> = ({
    isOpen,
    onOpenChange,
    isUploading,
}) => (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Processing Proposal</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                <p className="text-sm text-muted-foreground text-center">
                    {isUploading ? 'Uploading and scanning proposal file...' : 'Processing completed'}
                </p>
            </div>
        </DialogContent>
    </Dialog>
);
