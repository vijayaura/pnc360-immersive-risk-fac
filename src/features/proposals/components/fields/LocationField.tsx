import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';
import { BaseFieldProps } from '../../types/form';
import { FieldLabelWithNote } from './FieldLabelWithNote';

interface LocationFieldProps extends BaseFieldProps {
  onOpenMap: (fieldId: string) => void;
}

export function LocationField({
  field,
  value,
  error,
  isFieldRequired,
  onOpenMap,
  disabled,
}: LocationFieldProps) {
  const displayValue = value ? String(value) : '';

  return (
    <div className="h-full flex flex-col">
      <div className="mb-2 flex-grow">
        <FieldLabelWithNote
          label={field.label}
          required={isFieldRequired(field)}
          note={field.metadata?.note}
          htmlFor={field.id}
        />
      </div>

      <div className="space-y-2">
        <div className="relative">
          <Input
            id={field.id}
            readOnly
            value={displayValue}
            placeholder={field.placeholder || 'Select location on map'}
            className={`pr-10 cursor-pointer ${error ? 'border-destructive' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => {
              if (!disabled && onOpenMap) onOpenMap(field.id);
            }}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
            <MapPin className="w-4 h-4" />
          </span>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}
        {!error && <p className="text-xs text-transparent">&nbsp;</p>}
      </div>
    </div>
  );
}
