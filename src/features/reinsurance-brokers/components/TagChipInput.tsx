import { useState, useRef, KeyboardEvent, ClipboardEvent } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/shared/utils/lib-utils";

interface TagChipInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const TagChipInput = ({
  value,
  onChange,
  placeholder = "Type and press Enter",
  disabled = false,
  className,
}: TagChipInputProps) => {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addTags = (candidates: string[]) => {
    const next = [...value];
    for (const tag of candidates) {
      const normalized = tag.trim();
      if (!normalized) continue;
      const exists = next.some((t) => t.toLowerCase() === normalized.toLowerCase());
      if (!exists) next.push(normalized);
    }
    if (next.length !== value.length) onChange(next);
  };

  const commitInput = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    addTags(trimmed.split(/[,;]+/));
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
    addTags(e.clipboardData.getData("text").split(/[,;\n]+/));
    setInput("");
  };

  return (
    <div
      className={cn(
        "flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5",
        "ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
      onClick={() => !disabled && inputRef.current?.focus()}
    >
      {value.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-1 pl-2 pr-1 font-normal">
          {tag}
          {!disabled && (
            <button
              type="button"
              className="rounded-full p-0.5 hover:bg-muted-foreground/20"
              onClick={(e) => {
                e.stopPropagation();
                onChange(value.filter((t) => t !== tag));
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
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commitInput}
        onPaste={handlePaste}
        placeholder={value.length === 0 ? placeholder : ""}
        className="h-7 min-w-[120px] flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
      />
    </div>
  );
};

export default TagChipInput;
