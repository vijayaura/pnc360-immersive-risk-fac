import { useMemo, useRef, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { BaseFieldProps } from '../../types/form';
import { useToast } from '@/shared/hooks/use-toast';
import {
  getConsentFieldValue,
  getConsentMetadata,
  type ConsentDocumentConfig,
} from '@/features/product-config/proposal-form/utils/consent';
import { RichTextContent } from '@/features/product-config/proposal-form/components/RichTextEditor';
import { Clock, Eye, FileText, Info, Trash2, Upload } from 'lucide-react';

export function ConsentField({
  field,
  value,
  onChange,
  isFieldRequired,
  error,
  disabled,
}: BaseFieldProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const consent = getConsentMetadata(field);
  const consentValue = getConsentFieldValue(value);
  const isAccepted = consentValue.accepted;
  const isLocked = disabled || isAccepted;
  const activeDocuments = (consent.consentDocuments || []).filter((doc) => doc.active);
  const note = field.metadata?.note as string | undefined;
  const isRequired = isFieldRequired(field);

  const contentHtml = useMemo(() => {
    if (consent.consentContentHtml?.trim()) return consent.consentContentHtml;
    return `<p>${field.label}</p>`;
  }, [consent.consentContentHtml, field.label]);

  const openConsent = () => {
    if (isLocked) return;
    setIsDialogOpen(true);
  };

  const updateConsentValue = (
    next: Partial<{ accepted: boolean; documents: Record<string, File | string | null> }>,
  ) => {
    onChange(field.name, {
      accepted: next.accepted ?? consentValue.accepted,
      documents: next.documents ?? consentValue.documents ?? {},
    });
  };

  const updateDocument = (documentId: string, file: File | string | null) => {
    updateConsentValue({
      documents: {
        ...(consentValue.documents || {}),
        [documentId]: file,
      },
    });
  };

  const missingRequiredDocument = activeDocuments.find(
    (doc) => doc.required && !consentValue.documents?.[doc.id],
  );

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Phantom label space to align with neighbor fields that have labels */}
        <div className="hidden md:block mb-2">
          <div className="h-5" />
        </div>

        <div className="flex items-start gap-3 py-1">
          <Checkbox
            id={field.id}
            checked={isAccepted}
            disabled={isLocked}
            onCheckedChange={() => openConsent()}
            className="mt-1"
          />
          <div className="space-y-1">
            <div className="flex items-start gap-1">
              <div
                className={`text-sm font-medium leading-6 ${
                  isLocked ? 'text-muted-foreground' : 'text-foreground'
                }`}
              >
                <span>{field.label}</span>
                {consent.consentLinkText && (
                  <>
                    {' '}
                    <button
                      type="button"
                      onClick={openConsent}
                      disabled={isLocked}
                      className="inline p-0 text-sm font-medium text-primary underline underline-offset-4 disabled:cursor-not-allowed disabled:text-muted-foreground"
                    >
                      {consent.consentLinkText}
                    </button>
                  </>
                )}
                {isRequired && <span className="ml-1 text-destructive">*</span>}
              </div>
              {note && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="mt-1 inline-flex shrink-0 items-center justify-center rounded-full p-1 transition-colors hover:bg-primary/10"
                      onClick={(e) => e.preventDefault()}
                      aria-label={`Info about ${field.label}`}
                      title="Click for definition"
                    >
                      <Info className="h-4 w-4 cursor-help text-primary transition-colors hover:text-primary/80" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    className="z-[9999] max-w-md p-4 text-left text-sm"
                    side="bottom"
                    align="start"
                  >
                    <div className="mb-2 text-left font-semibold">{field.label}</div>
                    <div className="break-words whitespace-normal text-left text-xs leading-relaxed">
                      {note}
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{consent.consentLinkText || field.label}</DialogTitle>
          </DialogHeader>

          <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
            <div className="rounded-lg border bg-muted/20 p-4">
              <RichTextContent html={contentHtml} />
            </div>

            {activeDocuments.map((doc) => (
              <ConsentDocumentUpload
                key={doc.id}
                doc={doc}
                value={consentValue.documents?.[doc.id] ?? null}
                onChange={(file) => updateDocument(doc.id, file)}
              />
            ))}
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                updateConsentValue({ accepted: false });
                setIsDialogOpen(false);
              }}
            >
              Decline
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (missingRequiredDocument) {
                  toast({
                    title: 'Required Document Missing',
                    description: `${missingRequiredDocument.label} is required.`,
                    variant: 'destructive',
                  });
                  return;
                }
                updateConsentValue({ accepted: true });
                setIsDialogOpen(false);
              }}
            >
              Accept
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ConsentDocumentUpload({
  doc,
  value,
  onChange,
}: {
  doc: ConsentDocumentConfig;
  value: File | string | null;
  onChange: (file: File | string | null) => void;
}) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileName =
    value instanceof File ? value.name : typeof value === 'string' ? value : '';
  const canPreviewFile =
    value instanceof File &&
    (value.type.startsWith('image/') || value.type === 'application/pdf');

  return (
    <>
      <div
        className={`rounded-xl border-2 p-4 transition-all ${
          fileName
            ? 'border-success/30 bg-success/5 shadow-sm'
            : doc.required
              ? 'border-primary/30 bg-primary/5'
              : 'border-border bg-card/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            onChange(file);
          }}
        />

        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-start space-x-4">
            <div className="mt-1">
              {fileName ? (
                <FileText className="w-5 h-5 text-success" />
              ) : (
                <Clock className="w-5 h-5 text-warning" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h4 className="font-semibold text-sm text-foreground">{doc.label}</h4>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[11px] ${
                    doc.required
                      ? 'text-warning border-warning'
                      : 'text-muted-foreground border-muted-foreground/30'
                  }`}
                >
                  {doc.required ? 'Required' : 'Optional'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {doc.description || 'Upload the required document'}
              </p>
              {fileName && (
                <div className="mb-2 flex min-w-0 items-center space-x-2 text-xs">
                  <FileText className="w-3 h-3 text-primary" />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="block min-w-0 truncate text-primary font-medium">
                        {fileName}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs break-words whitespace-normal">
                      {fileName}
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
          </div>

          <div className="ml-4 flex min-w-[100px] shrink-0 flex-col items-stretch gap-2">
            {fileName ? (
              <>
                {canPreviewFile && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs justify-start"
                    type="button"
                    onClick={() => setIsPreviewOpen(true)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs text-destructive hover:text-destructive justify-start"
                  type="button"
                  onClick={() => {
                    onChange(null);
                    if (inputRef.current) inputRef.current.value = '';
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90 border-primary h-8 px-3 text-xs justify-start"
                type="button"
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-1" />
                Upload
              </Button>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>{value instanceof File ? value.name : doc.label}</DialogTitle>
          </DialogHeader>
          {value instanceof File &&
            (value.type.startsWith('image/') ? (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <img
                  src={URL.createObjectURL(value)}
                  alt={value.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : (
              <iframe
                src={URL.createObjectURL(value)}
                className="w-full h-full border-0"
                title="File Preview"
              />
            ))}
        </DialogContent>
      </Dialog>
    </>
  );
}
