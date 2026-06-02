import { useState, useRef, KeyboardEvent, ClipboardEvent } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/shared/utils/lib-utils";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseEmails(raw: string): string[] {
  return raw
    .split(/[,;\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

interface EmailChipInputProps {
  value: string[];
  onChange: (emails: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const EmailChipInput = ({
  value,
  onChange,
  placeholder = "Add email and press Enter",
  disabled = false,
  className,
}: EmailChipInputProps) => {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addEmails = (candidates: string[]) => {
    if (!candidates.length) return;
    const next = [...value];
    let invalid: string | null = null;

    for (const email of candidates) {
      if (!EMAIL_PATTERN.test(email)) {
        invalid = email;
        continue;
      }
      if (!next.includes(email)) next.push(email);
    }

    if (invalid) {
      setError(`"${invalid}" is not a valid email`);
    } else {
      setError(null);
    }

    if (next.length !== value.length) onChange(next);
  };

  const commitInput = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    addEmails(parseEmails(trimmed));
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitInput();
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    addEmails(parseEmails(pasted));
    setInput("");
  };

  const remove = (email: string) => {
    onChange(value.filter((e) => e !== email));
    setError(null);
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      <div
        className={cn(
          "flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5",
          "ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          disabled && "cursor-not-allowed opacity-50",
        )}
        onClick={() => !disabled && inputRef.current?.focus()}
      >
        {value.map((email) => (
          <Badge key={email} variant="secondary" className="gap-1 pl-2 pr-1 font-normal">
            {email}
            {!disabled && (
              <button
                type="button"
                className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(email);
                }}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
        <Input
          ref={inputRef}
          value={input}
          disabled={disabled}
          onChange={(e) => {
            setInput(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          onBlur={commitInput}
          onPaste={handlePaste}
          placeholder={value.length === 0 ? placeholder : ""}
          className="h-7 min-w-[140px] flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};

export default EmailChipInput;
