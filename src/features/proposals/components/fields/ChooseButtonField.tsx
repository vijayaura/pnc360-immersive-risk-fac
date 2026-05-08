/**
 * ChooseButtonField Component
 *
 * Renders a group of buttons for radio-style selection.
 * Only one option can be selected at a time (like radio buttons but as buttons).
 */

import { Button } from "@/components/ui/button";
import { Circle, CheckCircle2 } from "lucide-react";
import { BaseFieldProps } from "../../types/form";
import { FieldLabelWithNote } from "./FieldLabelWithNote";

export function ChooseButtonField({
  field,
  value,
  error,
  onChange,
  isFieldRequired,
  formData,
  disabled,
}: BaseFieldProps) {
  const selectedValue = value ?? field.defaultValue;

  const handleOptionClick = (optionValue: string) => {
    onChange(field.name, optionValue);
  };

  // Handle dependent options filtering
  let options: Array<{ label: string; value: string } | string> = [];
  let isDisabled = Boolean(disabled);
  let placeholderText = "";

  if (field.dependentOn && field.dependentOptions) {
    const parentValue = formData?.[field.dependentOn];

    if (!parentValue || parentValue === "") {
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

      // Collect all dependent options
      const allDependentOpts = new Set<string>();
      parentValues.forEach((pv) => {
        const opts = field.dependentOptions![pv] || [];
        opts.forEach((opt) => allDependentOpts.add(String(opt)));
      });

      options = Array.from(allDependentOpts);
    }
  } else {
    // Static options
    options = field.options || [];
  }

  return (
    <div className="space-y-2">
      <FieldLabelWithNote
        label={field.label}
        required={isFieldRequired(field)}
        note={field.metadata?.note}
        htmlFor={field.id}
      />

      <div className="flex flex-wrap gap-2">
        {isDisabled ? (
          <div className="border rounded-lg p-4 bg-muted/30 w-full">
            <p className="text-sm text-muted-foreground text-center italic">
              {placeholderText}
            </p>
          </div>
        ) : options.length > 0 ? (
          options.map((option, idx) => {
            const label = typeof option === "string" ? option : option.label;
            const optionValue =
              typeof option === "string"
                ? option
                : option.value ?? option.label;
            const isSelected =
              selectedValue !== undefined && optionValue === selectedValue;
            const variant = isSelected
              ? "default"
              : (field.buttonVariant as "outline" | "secondary" | "ghost") ||
              "outline";

            return (
              <Button
                key={idx}
                type="button"
                variant={variant}
                className="gap-2"
                onClick={() => handleOptionClick(optionValue)}
              >
                {isSelected ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Circle className="w-4 h-4" />
                )}
                {label}
              </Button>
            );
          })
        ) : (
          <div className="border rounded-lg p-4 bg-muted/30 w-full">
            <p className="text-sm text-muted-foreground text-center">
              No options configured for this field.
            </p>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
      {!error && <p className="text-xs text-transparent">&nbsp;</p>}
    </div>
  );
}
