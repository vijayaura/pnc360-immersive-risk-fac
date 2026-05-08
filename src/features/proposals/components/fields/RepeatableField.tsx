import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Trash2, Plus, Upload, Loader2, X } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { BaseFieldProps } from '../../types/form';
import { FieldLabelWithNote } from './FieldLabelWithNote';
import { getDateValidationConstraints } from '../../utils/dateValidationConstraints';

export function RepeatableField({
  field,
  value = [],
  onChange,
  isFieldRequired,
  errors,
  error,
  formResponseId,
  disabled,
}: BaseFieldProps) {
  const { toast } = useToast();
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    rowIndex: number,
    fieldName: string,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      update(rowIndex, fieldName, file);
    }
  };
  const rows: any[] = Array.isArray(value) ? value : [];

  const addRow = () => {
    const row: Record<string, any> = {};
    field.subFields?.forEach((sf) => {
      row[sf.name] = '';
    });
    onChange(field.name, [...rows, row]);
  };

  const removeRow = (idx: number) => {
    const next = [...rows];
    next.splice(idx, 1);
    onChange(field.name, next);
  };

  const update = (idx: number, name: string, val: any) => {
    const next = [...rows];
    next[idx] = { ...next[idx], [name]: val };
    onChange(field.name, next);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <FieldLabelWithNote
          label={field.label}
          required={isFieldRequired(field)}
          note={field.metadata?.note}
        />

        {field.allowAddRemove && !disabled && (
          <Button size="sm" variant="outline" onClick={addRow}>
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        )}
      </div>

      <div className="border rounded-md">
        {rows.map((row, rowIdx) => (
          <div key={rowIdx} className="flex gap-4 p-4 border-t overflow-x-auto">
            {field.subFields?.map((sf) => {
              const val = row[sf.name];
              const updateVal = (v: any) => update(rowIdx, sf.name, v);
              const subFieldError = errors?.[`${field.name}.${rowIdx}.${sf.name}`];
              const isDatePeriod = sf.type === 'datePeriod';

              let input = null;

              switch (sf.type) {
                case 'text':
                case 'number':
                  input = (
                    <Input
                      value={val ?? ''}
                      type={sf.type}
                      placeholder={sf.placeholder}
                      onChange={(e) => updateVal(e.target.value)}
                      className={subFieldError ? 'border-destructive' : ''}
                      disabled={disabled}
                    />
                  );
                  break;

                case 'textarea':
                  input = (
                    <Textarea
                      value={val ?? ''}
                      onChange={(e) => updateVal(e.target.value)}
                      className={subFieldError ? 'border-destructive' : ''}
                      disabled={disabled}
                    />
                  );
                  break;

                case 'dropdown':
                  input = (
                    <Select value={val || undefined} onValueChange={updateVal} disabled={disabled}>
                      <SelectTrigger className={subFieldError ? 'border-destructive' : ''}>
                        <SelectValue placeholder={sf.placeholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {sf.options?.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                  break;

                case 'checkbox':
                  input = <Checkbox checked={!!val} onCheckedChange={updateVal} disabled={disabled} />;
                  break;

                case 'date':
                  input = (
                    <DatePicker
                      value={val ? String(val) : ''}
                      onChange={(date) => updateVal(date || '')}
                      placeholder="Select date"
                      className={subFieldError ? 'border-destructive' : ''}
                      disabled={disabled}
                    />
                  );
                  break;

                case 'datePeriod': {
                  const periodValue =
                    typeof val === 'object' && val !== null
                      ? (val as any)
                      : { startDate: '', endDate: '' };
                  const periodConstraints = getDateValidationConstraints(sf);
                  const effectiveToMinDate =
                    periodConstraints.toMinDate && periodValue.startDate
                      ? periodConstraints.toMinDate > periodValue.startDate
                        ? periodConstraints.toMinDate
                        : periodValue.startDate
                      : periodValue.startDate || periodConstraints.toMinDate;

                  input = (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          {sf.fromDateLabel && (
                            <label className="text-[10px] uppercase font-medium text-muted-foreground ml-1">
                              {sf.fromDateLabel}
                            </label>
                          )}
                          <DatePicker
                            value={periodValue.startDate || ''}
                            onChange={(date) => {
                              const newValue = {
                                ...periodValue,
                                startDate: date || '',
                              };
                              // If start date is after end date, clear end date
                              if (date && periodValue.endDate && date > periodValue.endDate) {
                                newValue.endDate = '';
                              }
                              updateVal(newValue);
                            }}
                            min={periodConstraints.fromMinDate}
                            max={periodConstraints.fromMaxDate}
                            placeholder="Start date"
                            className={subFieldError ? 'border-destructive' : ''}
                            disabled={disabled}
                          />
                        </div>
                        <div className="space-y-1">
                          {sf.toDateLabel && (
                            <label className="text-[10px] uppercase font-medium text-muted-foreground ml-1">
                              {sf.toDateLabel}
                            </label>
                          )}
                          <DatePicker
                            value={periodValue.endDate || ''}
                            onChange={(date) => {
                              // Validate that end date is not before start date
                              if (date && periodValue.startDate && date < periodValue.startDate) {
                                return;
                              }
                              updateVal({
                                ...periodValue,
                                endDate: date || '',
                              });
                            }}
                            min={effectiveToMinDate}
                            max={periodConstraints.toMaxDate}
                            placeholder="End date"
                            className={subFieldError ? 'border-destructive' : ''}
                            disabled={disabled}
                          />
                        </div>
                      </div>
                    </div>
                  );
                  break;
                }

                case 'file': {
                  const displayValue = val instanceof File ? val.name : String(val || '');
                  input = (
                    <div className="flex flex-col gap-2">
                      {val ? (
                        <div className="flex items-center gap-2 text-sm bg-primary/5 p-2 rounded border">
                          <Upload className="w-3 h-3 text-muted-foreground" />
                          <span className="truncate max-w-[200px]" title={displayValue}>
                            {displayValue}
                          </span>
                          {!disabled && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 ml-auto"
                              onClick={() => updateVal('')}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="relative">
                          <Input
                            type="file"
                            className={subFieldError ? 'border-destructive' : ''}
                            onChange={(e) => handleFileChange(e, rowIdx, sf.name)}
                            disabled={disabled}
                          />
                        </div>
                      )}
                    </div>
                  );
                  break;
                }
                default:
                  input = <div className="text-xs text-muted-foreground">Unsupported type</div>;
              }

              return (
                <div
                  key={sf.name}
                  id={`field-${field.name}.${rowIdx}.${sf.name}`}
                  className={`space-y-1 flex-shrink-0 ${isDatePeriod ? 'min-w-[500px]' : 'min-w-[200px]'}`}
                >
                  {sf.label && (
                    <label className="text-xs font-medium text-muted-foreground">
                      {sf.label}
                    </label>
                  )}
                  {input}
                  {subFieldError ? (
                    <p className="text-xs text-destructive">{subFieldError}</p>
                  ) : (
                    <p className="text-xs text-transparent min-h-[16px]">&nbsp;</p>
                  )}
                </div>
              );
            })}

            {field.allowAddRemove && !disabled && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive flex-shrink-0 mt-6"
                onClick={() => removeRow(rowIdx)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {rows.length === 0 && <p className="text-sm text-muted-foreground">No entries added yet.</p>}

      {/* Field level error */}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {!error && <p className="text-xs text-transparent">&nbsp;</p>}
    </div>
  );
}
