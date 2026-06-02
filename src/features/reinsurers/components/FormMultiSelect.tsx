import { ChevronsUpDown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/shared/utils/lib-utils";

type Option = { value: string; label: string };

interface FormMultiSelectProps {
  id?: string;
  options: readonly Option[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const FormMultiSelect = ({
  id,
  options,
  value,
  onChange,
  placeholder = "Select options",
  disabled = false,
  className,
}: FormMultiSelectProps) => {
  const selectedLabels = options
    .filter((opt) => value.includes(opt.value))
    .map((opt) => opt.label);

  const toggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const remove = (optionValue: string) => {
    onChange(value.filter((v) => v !== optionValue));
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            disabled={disabled}
            className="h-auto min-h-10 w-full justify-between py-2 font-normal"
          >
            <span className="flex flex-wrap gap-1 text-left">
              {selectedLabels.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : (
                selectedLabels.map((label) => {
                  const opt = options.find((o) => o.label === label);
                  if (!opt) return null;
                  return (
                    <Badge key={opt.value} variant="secondary" className="font-normal">
                      {label}
                      {!disabled && (
                        <button
                          type="button"
                          className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={(e) => {
                            e.stopPropagation();
                            remove(opt.value);
                          }}
                        >
                          <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </button>
                      )}
                    </Badge>
                  );
                })
              )}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <div className="max-h-60 overflow-y-auto p-3 space-y-2">
            {options.map((option) => {
              const checked = value.includes(option.value);
              return (
                <div key={option.value} className="flex items-start space-x-2">
                  <Checkbox
                    id={`${id ?? "multi"}-${option.value}`}
                    checked={checked}
                    disabled={disabled}
                    onCheckedChange={() => toggle(option.value)}
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor={`${id ?? "multi"}-${option.value}`}
                    className="text-sm font-normal leading-snug cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default FormMultiSelect;
