import { cn } from '@/shared/utils/lib-utils';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface TruncatedStatusBadgeProps {
    label: string;
    color: string;
}

export function TruncatedStatusBadge({ label, color }: TruncatedStatusBadgeProps) {
 const displayText = label;    
 const isLong = label.length > 9;
    const badge = (
   <Badge
  variant="outline"
  className={cn(
    "capitalize font-semibold max-w-[120px]",
    color
  )}
>
  <span className="block truncate max-w-[100px]">
    {displayText}
  </span>
</Badge>
    );

    if (!isLong) {
        return badge;
    }

    return (
        <TooltipProvider delayDuration={300}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="cursor-help inline-block max-w-full">
                        {badge}
                    </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px] p-3 text-xs leading-relaxed bg-[#0a1a1a] text-white border-teal-900/50">
                    <div className="font-bold mb-1.5 text-emerald-400 uppercase tracking-wider text-[10px]">Referral Status</div>
                    {label}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
