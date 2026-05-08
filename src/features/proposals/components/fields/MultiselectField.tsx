import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { BaseFieldProps } from "../../types/form";
import { FieldLabelWithNote } from "./FieldLabelWithNote";
import { normalizeOptions } from '@/shared/utils/form-helpers';
import { getMultiselectValidationConstraints } from "../../utils/multiselectValidationConstraints";

export function MultiselectField({
  field,
  value = [],
  error,
  onChange,
  isFieldRequired,
  formData,
  disabled,
}: BaseFieldProps) {
  // Get options - either from dependentOptions or static options
  let options: Array<{ label: string; value: string }> = [];
  let isDisabled = Boolean(disabled);
  let placeholderText = "";

  if (field.dependentOn && field.dependentOptions) {
    // Get parent field value from formData
    const parentValue = formData?.[field.dependentOn];

    if (!parentValue || parentValue === "") {
      // Parent not selected - disable field
      isDisabled = true;
      placeholderText = `Select ${field.dependentOn} first`;
    } else {
      // Handle multiple parent values (comma-separated for multiselect parents)
      const parentValues =
        typeof parentValue === "string"
          ? parentValue
            .split(",")
            .map((v) => v.trim())
            .filter((v) => v)
          : Array.isArray(parentValue)
            ? parentValue
            : [parentValue];

      // Collect all child options for all selected parent values
      const allChildOpts = new Set<string>();
      parentValues.forEach((pv) => {
        const opts = field.dependentOptions![pv] || [];
        opts.forEach((opt) => allChildOpts.add(String(opt)));
      });

      options = Array.from(allChildOpts).map((opt) => ({
        label: opt,
        value: opt,
      }));
    }
  } else {
    // Static options
    options = normalizeOptions(field.options || []);
  }

  const selected = Array.isArray(value) ? value : [];

  const toggle = (val: string) => {
    if (selected.includes(val)) {
      onChange(
        field.name,
        selected.filter((v) => v !== val)
      );
    } else {
      onChange(field.name, [...selected, val]);
    }
  };

  // Get multiselect validation constraints
  const constraints = getMultiselectValidationConstraints(field);
  const selectedCount = selected.length;
  const isMaxReached =
    constraints.maxSelections !== undefined &&
    selectedCount >= constraints.maxSelections;

  // Special card UI (Extensions Required)
  if (field.name === "extensionsRequired") {
    return (
      <div className="space-y-3">
        <FieldLabelWithNote
          label={field.label}
          required={isFieldRequired(field)}
          note={field.metadata?.note}
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {options.map((opt) => {
            const checked = selected.includes(opt.value);
            return (
              <Card
                key={opt.value}
                className={`cursor-pointer ${checked
                    ? "border-primary bg-primary/5"
                    : "hover:border-primary/50"
                  } ${isDisabled ? "pointer-events-none opacity-60" : ""}`}
                onClick={() => !isDisabled && toggle(opt.value)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <Checkbox checked={checked} />
                  <span className="font-medium">{opt.label}</span>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}
        {!error && <p className="text-xs text-transparent">&nbsp;</p>}
      </div>
    );
  }

  // Default checkbox list
  // When disabled due to dependent (parent not selected), show placeholder only.
  // When disabled due to rating parameter (or other), show options but disabled.
  const showPlaceholderOnly = isDisabled && placeholderText;

  return (
    <div className="space-y-2">
      <FieldLabelWithNote
        label={field.label}
        required={isFieldRequired(field)}
        note={field.metadata?.note}
      />

      {showPlaceholderOnly ? (
        <p className="text-sm text-muted-foreground italic py-2">
          {placeholderText}
        </p>
      ) : options.length === 0 ? (
        <p className="text-sm text-muted-foreground italic py-2">
          No options available
        </p>
      ) : (
        options.map((opt) => (
          <div
            key={opt.value}
            className={`flex items-center gap-2 ${isDisabled ? "opacity-90" : ""}`}
          >
            <Checkbox
              checked={selected.includes(opt.value)}
              disabled={
                isDisabled ||
                (isMaxReached && !selected.includes(opt.value))
              }
              onCheckedChange={() => {
                if (!isDisabled && (!isMaxReached || selected.includes(opt.value))) {
                  toggle(opt.value);
                }
              }}
            />
            <Label className="font-normal">{opt.label}</Label>
          </div>
        ))
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
      {!error && <p className="text-xs text-transparent">&nbsp;</p>}
    </div>
  );
}
