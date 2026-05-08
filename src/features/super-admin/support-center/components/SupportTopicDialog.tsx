import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { hasMeaningfulContent } from '@/features/product-config/proposal-form/components/RichTextEditor';
import { useToast } from '@/shared/hooks/use-toast';
import { cn } from '@/shared/utils/lib-utils';
import { SupportEditor } from './SupportEditor';
import { Plus } from 'lucide-react';
import type { SupportTopic } from '@/features/support/api/support';
import type {
  RichTextUploadOptions,
  RichTextUploadedImage,
  RichTextUploadedVideo,
} from '@/features/product-config/proposal-form/components/RichTextEditor';

interface SupportTopicDialogProps {
  open: boolean;
  topic?: SupportTopic | null;
  existingCategories: Array<{ id: string; categoryName: string }>;
  isSaving?: boolean;
  isCreatingCategory?: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateCategory: (categoryName: string) => Promise<string | void> | string | void;
  onSave: (payload: { categoryId: string; title: string; description: string }) => void;
  onEnsureTopicForUpload?: (payload: { categoryId: string; title: string; description: string }) => Promise<void> | void;
  onImageUpload?: (file: File, options?: RichTextUploadOptions) => Promise<RichTextUploadedImage>;
  onVideoUpload?: (file: File, options?: RichTextUploadOptions) => Promise<RichTextUploadedVideo>;
  onMediaUploadError?: (error: unknown) => void;
  onMediaDelete?: (fileId: string) => Promise<void>;
  onMediaDeleteError?: (error: unknown) => void;
}

export function SupportTopicDialog({
  open,
  topic,
  existingCategories,
  isSaving = false,
  isCreatingCategory = false,
  onOpenChange,
  onCreateCategory,
  onSave,
  onEnsureTopicForUpload,
  onImageUpload,
  onVideoUpload,
  onMediaUploadError,
  onMediaDelete,
  onMediaDeleteError,
}: SupportTopicDialogProps) {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categorySubmitted, setCategorySubmitted] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectedCategory(topic?.categoryId || existingCategories[0]?.id || '');
    setIsCategoryDialogOpen(false);
    setNewCategoryName('');
    setCategorySubmitted(false);
    setTitle(topic?.title || '');
    setDescription(topic?.description || '');
    setSubmitted(false);
  }, [existingCategories, open, topic]);

  const resolvedCategory = selectedCategory.trim();
  const hasDescription = hasMeaningfulContent(description);
  const categoryError = submitted && !resolvedCategory;
  const newCategoryError = categorySubmitted && !newCategoryName.trim();
  const titleError = submitted && !title.trim();
  const descriptionError = submitted && !hasDescription;

  const ensureTopicForUpload = async () => {
    if (topic || !onEnsureTopicForUpload) return;

    setSubmitted(true);
    if (!resolvedCategory || !title.trim()) {
      throw new Error('Please select a category and enter a title before uploading media.');
    }

    await onEnsureTopicForUpload({
      categoryId: resolvedCategory,
      title: title.trim(),
      description: hasDescription ? description : '<p><br></p>',
    });
  };

  const handleImageUpload = onImageUpload
    ? async (file: File, options?: RichTextUploadOptions) => {
        await ensureTopicForUpload();
        return onImageUpload(file, options);
      }
    : undefined;

  const handleVideoUpload = onVideoUpload
    ? async (file: File, options?: RichTextUploadOptions) => {
        await ensureTopicForUpload();
        return onVideoUpload(file, options);
      }
    : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[calc(100vw-2rem)] max-w-5xl flex-col gap-0 overflow-hidden rounded-3xl p-0 sm:w-[calc(100vw-3rem)]">
        <DialogHeader className="border-b border-border/70 px-6 py-5">
          <DialogTitle>{topic ? 'Edit Support Topic' : 'Create New Support Topic'}</DialogTitle>
          <DialogDescription>
            Add a clear title and write the support content you want to publish for Super Admin users.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Category <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger
                    className={cn(categoryError && 'border-destructive focus:ring-destructive/20')}
                  >
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {existingCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.categoryName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="default"
                className="gap-2"
                onClick={() => {
                  setIsCategoryDialogOpen(true);
                  setNewCategoryName('');
                  setCategorySubmitted(false);
                }}
                disabled={isSaving || isCreatingCategory}
              >
                <Plus className="h-4 w-4" />
                Create Category
              </Button>
            </div>
            {categoryError ? (
              <p className="text-xs text-destructive">A category is required before saving.</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="support-topic-title" className="text-sm font-medium text-foreground">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="support-topic-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Enter support topic title"
              className={cn('w-full', titleError && 'border-destructive focus-visible:ring-destructive/20')}
            />
            {titleError ? <p className="text-xs text-destructive">A title is required before saving.</p> : null}
          </div>

          <div className="rounded-2xl">
            <SupportEditor
              label={
                <>
                  Description <span className="text-destructive">*</span>
                </>
              }
              value={description}
              onChange={setDescription}
              placeholder="Write the support article content here..."
              contentClassName="[&_p]:mb-0 [&_p]:leading-6"
              editorClassName={cn(
                descriptionError && 'border-destructive focus-within:ring-destructive/20',
              )}
              onImageUpload={handleImageUpload}
              onImageUploadError={onMediaUploadError}
              onVideoUpload={handleVideoUpload}
              onVideoUploadError={onMediaUploadError}
              onMediaDelete={onMediaDelete}
              onMediaDeleteError={onMediaDeleteError}
            />
            {descriptionError ? (
              <p className="mt-2 text-xs text-destructive">A description is required before saving.</p>
            ) : null}
          </div>
        </div>

        <DialogFooter className="border-t border-border/70 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setSubmitted(true);
              if (!resolvedCategory || !title.trim() || !hasDescription) {
                toast({
                  title: 'All fields are required',
                  description: 'Please complete all required fields before saving this topic.',
                  variant: 'destructive',
                });
                return;
              }
              onSave({ categoryId: resolvedCategory, title: title.trim(), description });
            }}
            disabled={isSaving || isCreatingCategory}
          >
            {isSaving ? 'Saving...' : 'Save Topic'}
          </Button>
        </DialogFooter>

        <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
          <DialogContent className="max-w-md gap-0 p-0">
            <DialogHeader className="border-b border-border/70 px-6 py-5">
              <DialogTitle>Create Category</DialogTitle>
              <DialogDescription>
                Add a new category to group related support topics.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 px-6 py-6">
              <Label htmlFor="support-category-name" className="text-sm font-medium text-foreground">
                Category Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="support-category-name"
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                placeholder="Enter category name"
                className={cn(newCategoryError && 'border-destructive focus-visible:ring-destructive/20')}
              />
              {newCategoryError ? (
                <p className="text-xs text-destructive">A category name is required before saving.</p>
              ) : null}
            </div>

            <DialogFooter className="border-t border-border/70 px-6 py-4">
              <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  setCategorySubmitted(true);
                  const nextCategory = newCategoryName.trim();
                  if (!nextCategory) return;
                  const categoryId = await onCreateCategory(nextCategory);
                  if (!categoryId) return;
                  setSelectedCategory(categoryId);
                  setIsCategoryDialogOpen(false);
                  setNewCategoryName('');
                  setCategorySubmitted(false);
                }}
                disabled={isCreatingCategory}
              >
                {isCreatingCategory ? 'Saving...' : 'Save Category'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
