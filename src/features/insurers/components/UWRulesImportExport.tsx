import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Upload,
  Download,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import {
  exportUWRulesAsExcel,
  importUWRulesFromExcel,
} from '@/features/product-config/rating-configurator/api/uw-rules';

interface UWRulesImportExportProps {
  productId: string;
  productName: string;
  onImportComplete?: () => void;
}

const UWRulesImportExport: React.FC<UWRulesImportExportProps> = ({
  productId,
  productName,
  onImportComplete,
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export state
  const [isExporting, setIsExporting] = useState(false);

  // Import state
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      // Get the Excel blob directly
      const blob = await exportUWRulesAsExcel(productId);
      
      // Create and download the file
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `uw-rules-${productName.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export Successful',
        description: `UW rules exported successfully as Excel file.`,
      });

    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export UW rules. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please select an Excel file (.xlsx or .xls).',
        variant: 'destructive',
      });
      return;
    }

    // ── Client-side validation: block negative adjustmentValue and priority ──
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

      const negativeRows: number[] = [];
      rows.forEach((row, i) => {
        const adjVal = Number(
          row['Adjustment Value'] ?? row['adjustmentValue'] ?? row['adjustment_value'] ?? 0,
        );
        const priority = Number(
          row['Priority'] ?? row['priority'] ?? 1,
        );
        if (adjVal < 0 || priority < 1) {
          negativeRows.push(i + 1); // 1-based data row number
        }
      });

      if (negativeRows.length > 0) {
        toast({
          title: 'Invalid Values in Sheet',
          description: `Data row(s) ${negativeRows.join(', ')} contain negative Adjustment Value or Priority less than 1. Please fix and re-upload.`,
          variant: 'destructive',
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    } catch {
      // If parsing fails, let the backend handle it
    }

    try {
      setIsImporting(true);
      
      // Direct import without dialog
      const result = await importUWRulesFromExcel(productId, file, false); // Default to not overwrite

      toast({
        title: 'Import Completed',
        description: `${result.imported} rules imported, ${result.updated} updated, ${result.skipped} skipped.`,
      });

      // Call the callback to refresh the rules list
      if (onImportComplete) {
        onImportComplete();
      }

    } catch (error) {
      console.error('Import failed:', error);
      toast({
        title: 'Import Failed',
        description: 'Failed to import UW rules. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      {/* Export Button */}
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={handleExport}
        disabled={isExporting}
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Upload className="w-4 h-4" />
        )}
        Export
      </Button>

      {/* Import Button */}
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => fileInputRef.current?.click()}
        disabled={isImporting}
      >
        {isImporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        Import
      </Button>

      {/* Hidden File Input */}
      <Input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileSelect}
        className="hidden"
      />
    </>
  );
};

export default UWRulesImportExport;