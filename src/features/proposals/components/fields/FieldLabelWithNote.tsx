import { Label } from '@/components/ui/label';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { cn } from '@/shared/utils/lib-utils';

interface FieldLabelWithNoteProps {
  label: string;
  required?: boolean;
  note?: string | null;
  htmlFor?: string;
  className?: string;
  asSpan?: boolean;
}

export function FieldLabelWithNote({
  label: labelProp,
  required,
  note,
  htmlFor,
  className,
  asSpan = false,
}: FieldLabelWithNoteProps) {
  const label = labelProp ?? '';
  return (
    <div className="flex items-center flex-wrap">
      {asSpan ? (
        <span className={cn(className)}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </span>
      ) : (
        <Label htmlFor={htmlFor} className={cn(className)}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      {note && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full hover:bg-primary/10 p-1 focus:outline-none transition-colors shrink-0 ml-1"
              onClick={(e) => e.preventDefault()}
              aria-label={`Info about ${label}`}
              title="Click for definition"
            >
              <Info className="h-4 w-4 text-primary hover:text-primary/80 transition-colors cursor-help" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            className="max-w-md p-4 text-sm z-[9999] text-left"
            side="bottom"
            align="start"
          >
            <div className="font-semibold mb-2 text-left">{label}</div>
            <div className="text-xs leading-relaxed text-left break-words whitespace-normal">
              {note}
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
