import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Save, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import {
  getFeeTypes,
  saveFeeTypes,
  type FeeType,
} from '@/features/product-config/pricing/api/ratings';
import { FormattedNumberInput } from '@/components/ui';
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Switch } from '@/components/ui/switch';


type PremiumAdditivesProps = {
    productId?: string;
};

type FeeTypeEntry = {
    id: string | number;
    label: string;
    pricingType: 'percentage' | 'fixed';
    value: string;
    status: 'active' | 'inactive';
    isEditable: boolean;
    organizationId: string | null;
    isNew?: boolean;
};

export default function PremiumAdditives() {
    const [feeTypes, setFeeTypes] = useState<FeeTypeEntry[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [invalidFeeLabelIds, setInvalidFeeLabelIds] = useState<Array<string | number>>([]);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const productId = searchParams.get("productId");

    // Load fee types on mount if productId is provided
    useEffect(() => {
        if (productId) {
            loadFeeTypes();
        }
    }, [productId]);

    const loadFeeTypes = async () => {
        if (!productId) return;
        
        try {
            const data = await getFeeTypes(productId);
            if (data) {
                setFeeTypes(
                (data || []).map((f) => ({
                    id: f.id || Date.now(),
                    label: f.label,
                    pricingType: (f.adjustmentType === 'PERCENTAGE' ? 'percentage' : 'fixed') as
                    | 'percentage'
                    | 'fixed',
                    value: String(f.adjustmentValue),
                    status: (f.status === 'ACTIVE' ? 'active' : 'inactive') as 'active' | 'inactive',
                    isEditable: f.isEditable,
                    organizationId: f.organizationId,
                    isNew: false,
                })),
                );
            }
        } catch (error) {
            console.error('Failed to load fee types', error);
            toast.error('Error', {
                description: 'Failed to load fee types. Please try again.',
            });
        }
    };

    const addFeeTypeEntry = () => {
        setFeeTypes((prev) => [
        ...prev,
        { id: Date.now(), label: '', pricingType: 'percentage', value: '0', status: 'active', isEditable: false, organizationId: null, isNew: true },
        ]);
    };

    const updateFeeTypeEntry = (
        id: string | number,
        field: string,
        value: string | number | boolean,
    ) => {
        if (field === 'label') {
            const normalizedValue = String(value ?? '').trim();
            setInvalidFeeLabelIds((prev) =>
                normalizedValue === ''
                    ? Array.from(new Set([...prev, id]))
                    : prev.filter((entryId) => entryId !== id),
            );
        }
        setFeeTypes((prev) =>
        prev.map((entry) => (entry.id === id ? { ...entry, [field]: value } : entry)),
        );
    };

    const removeFeeTypeEntry = (id: string | number) => {
        setInvalidFeeLabelIds((prev) => prev.filter((entryId) => entryId !== id));
        setFeeTypes((prev) => prev.filter((entry) => entry.id !== id));
    };

    const saveConfiguration = async () => {
        if (!productId) {
            toast.error('Error', {
                description: 'Product ID is required to save fee types.',
            });
            return;
        }

        const blankLabelIds = feeTypes
            .filter((fee) => String(fee.label || '').trim() === '')
            .map((fee) => fee.id);
        if (blankLabelIds.length > 0) {
            setInvalidFeeLabelIds(blankLabelIds);
            toast.error('Validation Error', {
                description: 'Label is required for all fee types.',
            });
            return;
        }

        setIsSaving(true);
        try {
            await saveFeeTypes(
                productId,
                feeTypes.map((f) => ({
                    id: typeof f.id === 'string' ? f.id : undefined,
                    label: String(f.label || '').trim(),
                    adjustmentType: f.pricingType === 'percentage' ? 'PERCENTAGE' : 'FIXED',
                    adjustmentValue: Number(f.value),
                    status: f.status === 'active' ? 'ACTIVE' : 'INACTIVE',
                    isEditable: f.isEditable,
                })),
            );
            toast.success('Configuration Saved', {
                description: 'Fee types have been saved successfully.',
            });
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Error', {
                description: 'Failed to save configuration. Please try again.',
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col justify-between h-screen mx-auto py-6">
            <div className='flex flex-col gap-10'>
                <div className="border-b bg-background px-6 py-4 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(-1)}
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Premium Additives</h1>
                            <p className="text-sm text-muted-foreground">
                            Manage and customize your workflow settings here.
                            </p>
                        </div>
                    </div>
                </div>
                <div className='container'>
                <Card className="border border-border bg-card">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Fee Types</CardTitle>
                        <CardDescription>
                        Configure fee types and their values (VAT, GST, etc.)
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={addFeeTypeEntry}>
                        Add Row
                        </Button>
                        <Button onClick={saveConfiguration} disabled={isSaving} size="sm">
                            <Save className="w-4 h-4 mr-2" />
                            {isSaving ? 'Saving...' : 'Save Fee Types'}
                        </Button>
                    </div>
                    </CardHeader>
                    <CardContent>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead className="w-1/4">Label</TableHead>
                            <TableHead className="w-1/4">Pricing Type</TableHead>
                            <TableHead className="w-1/4">Value</TableHead>
                            <TableHead className="w-1/4">Status</TableHead>
                            <TableHead className="w-24 text-center">Editable</TableHead>
                            <TableHead className="w-16">Actions</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {feeTypes.length === 0 ? (
                            <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                No fee types configured. Click "Add Row" to add a new fee type.
                            </TableCell>
                            </TableRow>
                        ) : (
                            feeTypes.map((fee) => (
                            <TableRow key={fee.id} className="align-top">
                                <TableCell className="align-top py-4">
                                <div className="min-h-[40px]">
                                    <Input
                                        type="text"
                                        value={fee.label}
                                        onChange={(e) => updateFeeTypeEntry(fee.id, 'label', e.target.value)}
                                        className={`w-full ${invalidFeeLabelIds.includes(fee.id) ? 'border-destructive' : ''}`}
                                        placeholder="Enter fee type name"
                                    />
                                    {invalidFeeLabelIds.includes(fee.id) && (
                                        <p className="mt-1 text-xs text-destructive">
                                            Label is required.
                                        </p>
                                    )}
                                </div>
                                </TableCell>
                                <TableCell className="align-top py-4">
                                <Select
                                    value={fee.pricingType}
                                    onValueChange={(value) =>
                                    updateFeeTypeEntry(fee.id, 'pricingType', value)
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                    <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                    <SelectItem value="percentage">Percentage</SelectItem>
                                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                                    </SelectContent>
                                </Select>
                                </TableCell>
                                <TableCell className="align-top py-4">
                                    <FormattedNumberInput
                                        value={parseFloat(fee.value) || 0}
                                        onChange={(val) => updateFeeTypeEntry(fee.id, 'value', String(val))}
                                        suffix={fee.pricingType === 'percentage' ? '%' : 'AED'}
                                        className="w-full"
                                    />
                                </TableCell>
                                <TableCell className="align-top py-4">
                                <Select
                                    value={fee.status}
                                    onValueChange={(value) => updateFeeTypeEntry(fee.id, 'status', value)}
                                >
                                    <SelectTrigger className="w-full">
                                    <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                                </TableCell>
                                <TableCell className="text-center align-top py-4">
                                    <Switch
                                        checked={fee.isEditable}
                                        onCheckedChange={(checked) =>
                                            updateFeeTypeEntry(fee.id, 'isEditable', checked)
                                        }
                                    />
                                </TableCell>
                                <TableCell className="align-top py-4">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeFeeTypeEntry(fee.id)}
                                    aria-label="Remove fee type"
                                    className="text-destructive hover:text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                                </TableCell>
                            </TableRow>
                            ))
                        )}
                        </TableBody>
                    </Table>
                    </CardContent>
                </Card>
                </div>
            </div>
            <div>
                <Footer />
            </div>
        </div>
    );
}

