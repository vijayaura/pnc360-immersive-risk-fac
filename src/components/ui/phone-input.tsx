import * as React from "react";
import {
  defaultCountries,
  FlagImage,
  parseCountry,
  PhoneInputProps as RIPPhoneInputProps,
  usePhoneInput,
} from "react-international-phone";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/shared/utils/lib-utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type CountryIso2 = "ae" | "sa" | "us" | "gb" | "in" | (string & {});

const UAE_ISO2 = "ae" as const;

export interface PhoneInputProps
  extends Omit<RIPPhoneInputProps, "value" | "onChange" | "defaultCountry"> {
  value: string;
  onChange: (value: string) => void;
  defaultCountry?: CountryIso2;
  error?: string;
  compact?: boolean;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      className,
      value,
      onChange,
      error,
      defaultCountry = UAE_ISO2,
      countries = defaultCountries,
      disabled,
      placeholder,
      name,
      required,
      autoFocus,
      onBlur,
      onFocus,
      inputProps,
      preferredCountries = [UAE_ISO2],
      compact,
      ...rest
    },
    ref,
  ) => {
    const innerRef = React.useRef<HTMLInputElement | null>(null);
    const [open, setOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState("");

    React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement | null);

    const orderedPreferredCountries = React.useMemo(
      () => [UAE_ISO2, ...preferredCountries.filter((c) => c !== UAE_ISO2)],
      [preferredCountries],
    );

    const { inputValue, handlePhoneValueChange, country, setCountry } = usePhoneInput({
      value,
      defaultCountry,
      countries,
      preferredCountries: orderedPreferredCountries,
      onChange: ({ phone }) => onChange(phone),
      inputRef: innerRef,
      // National digits in the text field; full E.164 still passed to onChange (libphonenumber-compatible).
      disableDialCodeAndPrefix: true,
      ...rest,
    });

    const parsedCountries = React.useMemo(
      () => countries.map((countryData) => parseCountry(countryData)),
      [countries],
    );

    const filteredCountries = React.useMemo(() => {
      const query = searchTerm.trim().toLowerCase();
      const numericQuery = query.replace(/\D/g, "");

      const sortUaeFirst = (items: ReturnType<typeof parseCountry>[]) => {
        const uae = items.find((item) => item.iso2 === UAE_ISO2);
        if (!uae) return items;
        return [uae, ...items.filter((item) => item.iso2 !== UAE_ISO2)];
      };

      if (!query) return sortUaeFirst(parsedCountries);

      return sortUaeFirst(
        parsedCountries.filter((item) => {
        const countryName = item.name.toLowerCase();
        const iso2 = item.iso2.toLowerCase();
        const dialCode = item.dialCode.toLowerCase();
        const countryWords = countryName.split(/\s+/);

        const matchesName =
          countryName === query ||
          countryName.startsWith(query) ||
          countryWords.some((word) => word.startsWith(query)) ||
          countryName.includes(query);

        const matchesIso2 = iso2 === query || iso2.startsWith(query);
        const matchesDialCode =
          numericQuery.length > 0 &&
          (dialCode.startsWith(numericQuery) || `+${dialCode}`.startsWith(query));

        return matchesName || matchesIso2 || matchesDialCode;
        }),
      );
    }, [parsedCountries, searchTerm]);

    React.useEffect(() => {
      if (!open) {
        setSearchTerm("");
      }
    }, [open]);

    return (
      <div className={cn("space-y-1 w-full", className)}>
        <div className="flex gap-2 w-full min-w-0">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                disabled={disabled}
                className={cn(
                  "shrink-0 justify-between gap-1.5 rounded-md border border-input bg-background font-normal",
                  compact
                    ? "h-10 min-w-[5.75rem] w-auto max-w-none px-2 text-xs"
                    : "h-10 min-w-[7.25rem] w-auto max-w-none px-2.5 text-sm",
                  error && "border-destructive",
                )}
              >
                <span className="flex min-w-0 flex-1 items-center gap-1.5">
                  <FlagImage iso2={country.iso2} className="shrink-0" />
                  <span className="whitespace-nowrap tabular-nums">+{country.dialCode}</span>
                </span>
                <ChevronDown
                  className={cn("shrink-0 opacity-60", compact ? "h-3 w-3" : "h-4 w-4")}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Search country or code..."
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                />
                <CommandList>
                  <CommandEmpty>No country found.</CommandEmpty>
                  <CommandGroup>
                    {filteredCountries.map((item) => (
                      <CommandItem
                        key={`${item.iso2}-${item.dialCode}`}
                        value={`${item.name} ${item.iso2} ${item.dialCode}`}
                        onSelect={() => {
                          setCountry(item.iso2, { focusOnInput: true });
                          setOpen(false);
                        }}
                        className="gap-2"
                      >
                        <FlagImage iso2={item.iso2} />
                        <span className="flex-1 truncate">{item.name}</span>
                        <span className="text-xs text-muted-foreground">+{item.dialCode}</span>
                        <Check
                          className={cn(
                            "h-4 w-4",
                            item.iso2 === country.iso2 ? "opacity-100" : "opacity-0",
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <input
            {...inputProps}
            ref={innerRef}
            type="tel"
            value={inputValue}
            onChange={handlePhoneValueChange}
            placeholder={placeholder}
            disabled={disabled}
            name={name}
            required={required}
            autoFocus={autoFocus}
            onBlur={onBlur}
            onFocus={onFocus}
            className={cn(
              "flex-1 min-w-0 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-destructive focus-visible:ring-destructive",
              inputProps?.className,
            )}
          />
        </div>
        {error ? (
          <p className="text-xs text-destructive">{error}</p>
        ) : (
          !compact && <p className="text-xs text-transparent min-h-[1rem]">&#8203;</p>
        )}
      </div>
    );
  },
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
