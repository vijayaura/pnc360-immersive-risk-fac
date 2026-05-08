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
import { hasMeaningfulContent } from '@/features/product-config/proposal-form/components/RichTextEditor';
import { useToast } from '@/shared/hooks/use-toast';
import { cn } from '@/shared/utils/lib-utils';
import { SupportEditor } from './SupportEditor';
import type { SupportFaq } from '@/features/support/api/support';
import type {
  RichTextUploadOptions,
  RichTextUploadedImage,
  RichTextUploadedVideo,
} from '@/features/product-config/proposal-form/components/RichTextEditor';

interface FAQDialogProps {
  open: boolean;
  faq?: SupportFaq | null;
  isSaving?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: { question: string; answer: string }) => void;
  onEnsureFaqForUpload?: (payload: { question: string; answer: string }) => Promise<void> | void;
  onImageUpload?: (file: File, options?: RichTextUploadOptions) => Promise<RichTextUploadedImage>;
  onVideoUpload?: (file: File, options?: RichTextUploadOptions) => Promise<RichTextUploadedVideo>;
  onMediaUploadError?: (error: unknown) => void;
  onMediaDelete?: (fileId: string) => Promise<void>;
  onMediaDeleteError?: (error: unknown) => void;
}

export function FAQDialog({
  open,
  faq,
  isSaving = false,
  onOpenChange,
  onSave,
  onEnsureFaqForUpload,
  onImageUpload,
  onVideoUpload,
  onMediaUploadError,
  onMediaDelete,
  onMediaDeleteError,
}: FAQDialogProps) {
  const { toast } = useToast();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [saveSubmitted, setSaveSubmitted] = useState(false);
  const [uploadSubmitted, setUploadSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setQuestion(faq?.question || '');
    setAnswer(faq?.answer || '');
    setSaveSubmitted(false);
    setUploadSubmitted(false);
  }, [open, faq]);

  const hasAnswer = hasMeaningfulContent(answer);
  const questionError = (saveSubmitted || uploadSubmitted) && !question.trim();
  const answerError = saveSubmitted && !hasAnswer;

  const ensureFaqForUpload = async () => {
    if (faq || !onEnsureFaqForUpload) return;

    setUploadSubmitted(true);
    if (!question.trim()) {
      throw new Error('Please enter the FAQ question before uploading media.');
    }

    await onEnsureFaqForUpload({
      question: question.trim(),
      answer: hasAnswer ? answer : '<p><br></p>',
    });
    setUploadSubmitted(false);
  };

  const handleImageUpload = onImageUpload
    ? async (file: File, options?: RichTextUploadOptions) => {
        await ensureFaqForUpload();
        return onImageUpload(file, options);
      }
    : undefined;

  const handleVideoUpload = onVideoUpload
    ? async (file: File, options?: RichTextUploadOptions) => {
        await ensureFaqForUpload();
        return onVideoUpload(file, options);
      }
    : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[calc(100vw-2rem)] max-w-5xl flex-col gap-0 overflow-hidden rounded-3xl p-0 sm:w-[calc(100vw-3rem)]">
        <DialogHeader className="border-b border-border/70 px-6 py-5">
          <DialogTitle>{faq ? 'Edit FAQ' : 'Add FAQ'}</DialogTitle>
          <DialogDescription>
            Enter the question and provide the answer content that should appear in the FAQ list.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
          <div className="space-y-2">
            <Label htmlFor="faq-question" className="text-sm font-medium text-foreground">
              Question <span className="text-destructive">*</span>
            </Label>
            <Input
              id="faq-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Enter the FAQ question"
              className={cn('w-full', questionError && 'border-destructive focus-visible:ring-destructive/20')}
            />
            {questionError ? <p className="text-xs text-destructive">A question is required before saving.</p> : null}
          </div>

          <div className="rounded-2xl">
            <SupportEditor
              label={
                <>
                  Answer <span className="text-destructive">*</span>
                </>
              }
              value={answer}
              onChange={setAnswer}
              placeholder="Write the FAQ answer here..."
              contentClassName="[&_p]:mb-0 [&_p]:leading-6"
              editorClassName={cn(answerError && 'border-destructive focus-within:ring-destructive/20')}
              showUploadPlaceholder={false}
              onImageUpload={handleImageUpload}
              onImageUploadError={onMediaUploadError}
              onVideoUpload={handleVideoUpload}
              onVideoUploadError={onMediaUploadError}
              onMediaDelete={onMediaDelete}
              onMediaDeleteError={onMediaDeleteError}
            />
            {answerError ? <p className="mt-2 text-xs text-destructive">An answer is required before saving.</p> : null}
          </div>
        </div>

        <DialogFooter className="border-t border-border/70 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setSaveSubmitted(true);
              if (!question.trim() || !hasAnswer) {
                toast({
                  title: 'All fields are required',
                  description: 'Please complete all required fields before saving this FAQ.',
                  variant: 'destructive',
                });
                return;
              }
              onSave({ question: question.trim(), answer });
            }}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save FAQ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
