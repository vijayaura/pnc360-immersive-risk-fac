import { Checkbox } from "@/components/ui/checkbox";
import { BaseFieldProps } from "../../types/form";
import { FieldLabelWithNote } from "./FieldLabelWithNote";

export function CheckboxField({
  field,
  value,
  error,
  onChange,
  isFieldRequired,
  disabled,
}: BaseFieldProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Phantom label space to align with neighbor fields that have labels */}
      <div className="hidden md:block mb-2">
        <div className="h-5" /> {/* Matches standard FieldLabelWithNote height */}
      </div>
      
      <div className="flex items-center gap-2 py-2.5">
        <Checkbox
          id={field.id}
          checked={Boolean(value)}
          onCheckedChange={(checked) => onChange(field.name, checked)}
          disabled={disabled}
        />
        <FieldLabelWithNote
          label={field.label}
          required={isFieldRequired(field)}
          note={field.metadata?.note}
          htmlFor={field.id}
          className="font-normal"
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
      {!error && <p className="text-xs text-transparent">&nbsp;</p>}
    </div>
  );
}
