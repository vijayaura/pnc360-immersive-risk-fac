import React from 'react';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface FormDesignHeaderProps {
    navigate: (path: number | string) => void;
    productName: string;
    productVersion: string;
    title?: string;
    backPath?: string;
    saveButtonLabel?: string;
    singleActionMode?: boolean;
    singleActionLoadingLabel?: string;
    showCategorySelect?: boolean;
    selectedCategory?: string;
    setSelectedCategory?: (value: string) => void;
    selectedTemplate: string;
    setSelectedTemplate: (value: string) => void;
    setIsFullscreenPreview: (value: boolean) => void;
    handleSaveForm: (isDraft: boolean) => void;
    isSavingDraft: boolean;
    canSave: boolean;
    hasUnsavedChanges: boolean;
    isPublished: boolean;
    isPublishing: boolean;
}

export const FormDesignHeader: React.FC<FormDesignHeaderProps> = ({
    navigate,
    productName,
    productVersion,
    title = 'Proposal Form Design',
    backPath,
    saveButtonLabel = 'Publish',
    singleActionMode = false,
    singleActionLoadingLabel = 'Saving...',
    showCategorySelect = false,
    selectedCategory = '',
    setSelectedCategory,
    selectedTemplate,
    setSelectedTemplate,
    setIsFullscreenPreview,
    handleSaveForm,
    isSavingDraft,
    canSave,
    hasUnsavedChanges,
    isPublished,
    isPublishing,
}) => {
    return (
        <div className="border-b bg-background px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(backPath || -1)}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{title}</h1>
                    <p className="text-sm text-muted-foreground">
                        {productName}
                        {productVersion ? ` - Version ${productVersion}` : ''}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {showCategorySelect && setSelectedCategory && (
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Individual">Individual</SelectItem>
                            <SelectItem value="Corporate">Corporate</SelectItem>
                            <SelectItem value="Government">Government</SelectItem>
                        </SelectContent>
                    </Select>
                )}
                <Button variant="outline" onClick={() => setIsFullscreenPreview(true)} className="gap-2">
                    <Eye className="w-4 h-4" />
                    Preview Form
                </Button>

                {!singleActionMode && (
                    <Button
                        onClick={() => handleSaveForm(true)}
                        className="gap-2"
                        disabled={isSavingDraft || !canSave || !hasUnsavedChanges || isPublished}
                    >
                        <Save className="w-4 h-4" />
                        {isSavingDraft ? 'Saving Draft...' : 'Save as Draft'}
                    </Button>
                )}
                <Button
                    onClick={() => handleSaveForm(false)}
                    className="gap-2"
                    disabled={isPublishing || !canSave || isPublished}
                >
                    <Save className="w-4 h-4" />
                    {singleActionMode
                        ? isPublishing
                            ? singleActionLoadingLabel
                            : saveButtonLabel
                        : isPublishing
                            ? 'Publishing...'
                            : saveButtonLabel}
                </Button>
            </div>
        </div>
    );
};
