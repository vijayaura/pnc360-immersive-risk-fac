import { Input } from "@/components/ui/input";
import { BaseFieldProps } from "../../types/form";
import { FieldLabelWithNote } from "./FieldLabelWithNote";

export function TextField({
  field,
  value,
  error,
  onChange,
  isFieldRequired,
  disabled,
}: BaseFieldProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-2"><FieldLabelWithNote
          label={field.label}
          required={isFieldRequired(field)}
          note={field.metadata?.note}
        />
      </div>

      <div className="space-y-2">
        <Input
          value={value ?? ""}
          placeholder={field.placeholder}
          onChange={(e) => onChange(field.name, e.target.value)}
          className={error ? "border-destructive" : ""}
          disabled={disabled}
        />

        {error && <p className="text-xs text-destructive">{error}</p>}
        {!error && <p className="text-xs text-transparent">&nbsp;</p>}
      </div>
    </div>
  );
}
