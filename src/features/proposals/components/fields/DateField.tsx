import { DatePicker } from '@/components/ui/date-picker';
import { BaseFieldProps } from '../../types/form';
import { getDateValidationConstraints } from '../../utils/dateValidationConstraints';
import { FieldLabelWithNote } from './FieldLabelWithNote';

export function DateField({
  field,
  value,
  error,
  onChange,
  isFieldRequired,
  disabled,
}: BaseFieldProps) {
  const constraints = getDateValidationConstraints(field);

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
        <DatePicker
          id={field.id}
          value={value || ''}
          onChange={(date) => onChange(field.name, date || '')}
          min={constraints.minDate}
          max={constraints.maxDate}
          mode={field.metadata?.is_year_only ? 'year' : 'date'}
          placeholder={field.metadata?.is_year_only ? 'Select year' : 'Select date'}
          className={error ? 'border-destructive' : ''}
          disabled={disabled}
        />

        {error && <p className="text-xs text-destructive">{error}</p>}
        {!error && <p className="text-xs text-transparent">&nbsp;</p>}
      </div>
    </div>
  );
}
