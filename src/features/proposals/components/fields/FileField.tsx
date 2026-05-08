import { Input } from '@/components/ui/input';
import { Upload, X, Eye } from 'lucide-react';
import { BaseFieldProps } from '../../types/form';
import { useState } from 'react';
import { useToast } from '@/shared/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { FieldLabelWithNote } from './FieldLabelWithNote';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { buildFileAcceptAttr, validateFileAgainstRules } from '../../utils/fileValidation';

export function FileField({
  field,
  value,
  error,
  onChange,
  isFieldRequired,
  formResponseId,
  disabled,
}: BaseFieldProps) {
  const { toast } = useToast();
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const openPreview = (file: File) => {
    setPreviewFile(file);
    setIsPreviewOpen(true);
  };

  const canPreviewFile = (file: File) => {
    return (
      file.type.startsWith('image/') ||
      file.type === 'application/pdf'
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validationError = validateFileAgainstRules(file, field.label, field.validations);
      if (validationError) {
        setUploadError(validationError);
        e.target.value = '';
        toast({
          title: 'Invalid file',
          description: validationError,
          variant: 'destructive',
        });
        return;
      }

      setUploadError('');
      onChange(field.name, file);
    }
  };

  const fileName = value instanceof File ? value.name : typeof value === 'string' ? value : '';
  const fileAcceptAttr = buildFileAcceptAttr(field.validations);
  const displayError = error || uploadError;

  return (
    <div className="space-y-2">
      <FieldLabelWithNote
        label={field.label}
        required={isFieldRequired(field)}
        note={field.metadata?.note}
      />

      {value ? (
        <div className="flex items-center gap-2 text-sm bg-primary/5 p-2 rounded border">
          <Upload className="w-4 h-4 text-muted-foreground" />
          <span className="truncate max-w-[200px]" title={fileName}>
            {fileName}
          </span>
          <div className="ml-auto flex items-center gap-0">
            {value instanceof File && canPreviewFile(value) && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => openPreview(value)}
              >
                <Eye className="w-4 h-4" />
              </Button>
            )}
            {!disabled && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setUploadError('');
                  onChange(field.name, '');
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="relative">
          <Input
            type="file"
            accept={fileAcceptAttr}
            onChange={handleFileChange}
            className={displayError ? 'border-destructive' : ''}
            disabled={disabled}
          />
        </div>
      )}

      {displayError && <p className="text-xs text-destructive">{displayError}</p>}
      {!displayError && <p className="text-xs text-transparent">&nbsp;</p>}

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>{previewFile?.name}</DialogTitle>
          </DialogHeader>
          {previewFile &&
            (previewFile.type.startsWith('image/') ? (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <img
                  src={URL.createObjectURL(previewFile)}
                  alt={previewFile.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : (
              <iframe
                src={URL.createObjectURL(previewFile)}
                className="w-full h-full border-0"
                title="File Preview"
              />
            ))}
        </DialogContent>
      </Dialog>
    </div>
  );
}
