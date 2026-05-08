import { TimePicker } from "@/components/ui/time-picker";
import { BaseFieldProps } from "../../types/form";
import { FieldLabelWithNote } from "./FieldLabelWithNote";

export function TimeField({
  field,
  value,
  error,
  onChange,
  isFieldRequired,
  disabled,
}: BaseFieldProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-2 flex-grow"><FieldLabelWithNote
          label={field.label}
          required={isFieldRequired(field)}
          note={field.metadata?.note}
          htmlFor={field.id}
        />
      </div>

      <div className="space-y-2">
        <TimePicker
          id={field.id}
          value={value ?? ""}
          onChange={(time) => onChange(field.name, time)}
          placeholder={field.placeholder ?? "Select time"}
          className={error ? "border-destructive" : ""}
          aria-invalid={!!error}
          aria-required={isFieldRequired(field)}
          disabled={disabled}
        />

        {error && <p className="text-xs text-destructive">{error}</p>}
        {!error && <p className="text-xs text-transparent">&nbsp;</p>}
      </div>
    </div>
  );
}
