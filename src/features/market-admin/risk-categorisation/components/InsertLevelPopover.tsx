import { useState, useRef, useEffect, type ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface InsertLevelPopoverProps {
  onInsert: (label: string) => void;
  trigger?: ReactNode;
  triggerLabel?: string;
  placeholder?: string;
}

export function InsertLevelPopover({
  onInsert,
  trigger,
  triggerLabel,
  placeholder = 'Enter label...',
}: InsertLevelPopoverProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleAdd = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onInsert(trimmed);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
            <Plus className="w-3 h-3" />
            {triggerLabel}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <p className="text-xs font-medium mb-2 text-muted-foreground">{placeholder}</p>
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
              if (e.key === 'Escape') setOpen(false);
            }}
            className="h-8 text-sm"
          />
          <Button size="sm" className="h-8 px-3 text-xs" onClick={handleAdd}>
            Add
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
