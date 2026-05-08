import { useState, type ReactNode } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import {
  RichTextEditor,
  type RichTextUploadOptions,
  type RichTextUploadedImage,
  type RichTextUploadedVideo,
} from '@/features/product-config/proposal-form/components/RichTextEditor';

interface SupportEditorProps {
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  editorClassName?: string;
  contentClassName?: string;
  showUploadPlaceholder?: boolean;
  onImageUpload?: (file: File, options?: RichTextUploadOptions) => Promise<RichTextUploadedImage>;
  onImageUploadError?: (error: unknown) => void;
  onVideoUpload?: (file: File, options?: RichTextUploadOptions) => Promise<RichTextUploadedVideo>;
  onVideoUploadError?: (error: unknown) => void;
  onMediaDelete?: (fileId: string) => Promise<void>;
  onMediaDeleteError?: (error: unknown) => void;
}

export function SupportEditor({
  label,
  value,
  onChange,
  placeholder,
  editorClassName,
  contentClassName,
  showUploadPlaceholder = false,
  onImageUpload,
  onImageUploadError,
  onVideoUpload,
  onVideoUploadError,
  onMediaDelete,
  onMediaDeleteError,
}: SupportEditorProps) {
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const { showConfirmDialogAsync, ConfirmDialog } = useConfirmDialog();

  const confirmMediaDelete = (mediaKind: 'image' | 'video') =>
    showConfirmDialogAsync({
      title: `Delete ${mediaKind === 'video' ? 'Video' : 'Image'}`,
      description: `Are you sure you want to delete this ${mediaKind}? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'destructive',
    });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-sm font-medium text-foreground">{label}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setIsFullscreenOpen(true)}
        >
          <Maximize2 className="h-4 w-4" />
          Full Screen
        </Button>
      </div>

      <RichTextEditor
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        editorHeightClassName="h-[220px] md:h-[280px] lg:h-[320px]"
        editorClassName={editorClassName}
        contentClassName={contentClassName}
        showUploadPlaceholder={showUploadPlaceholder}
        onImageUpload={onImageUpload}
        onImageUploadError={onImageUploadError}
        onVideoUpload={onVideoUpload}
        onVideoUploadError={onVideoUploadError}
        onMediaDelete={onMediaDelete}
        onMediaDeleteError={onMediaDeleteError}
        onMediaDeleteConfirm={confirmMediaDelete}
      />

      <Dialog open={isFullscreenOpen} onOpenChange={setIsFullscreenOpen}>
        <DialogContent
          showClose={false}
          className="flex h-[95vh] max-w-[96vw] flex-col gap-0 overflow-hidden p-0"
        >
          <div className="min-h-0 flex-1 overflow-hidden">
            <RichTextEditor
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              className="h-full min-h-0"
              helperText={null}
              editorHeightClassName="h-full"
              editorWrapperClassName="pl-3 pr-3 pb-3"
              editorClassName={editorClassName}
              contentClassName={contentClassName}
              showUploadPlaceholder={showUploadPlaceholder}
              toolbarClassName="rounded-none border-x-0 border-t-0 shadow-none"
              toolbarEndContent={
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-xl"
                  onClick={() => setIsFullscreenOpen(false)}
                  aria-label="Collapse full screen editor"
                  title="Collapse"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
              }
              onImageUpload={onImageUpload}
              onImageUploadError={onImageUploadError}
              onVideoUpload={onVideoUpload}
              onVideoUploadError={onVideoUploadError}
              onMediaDelete={onMediaDelete}
              onMediaDeleteError={onMediaDeleteError}
              onMediaDeleteConfirm={confirmMediaDelete}
            />
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog />
    </div>
  );
}
