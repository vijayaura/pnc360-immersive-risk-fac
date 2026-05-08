import { Badge } from "@/components/ui/badge";
import { getQuoteStatusLabel, getQuoteStatusColor, type QuoteStatus } from "@/lib/quote-status";
import { cn } from "@/shared/utils/lib-utils";

interface QuoteStatusDotProps {
  status: QuoteStatus | string;
  className?: string;
}

export const QuoteStatusDot = ({ status, className = "" }: QuoteStatusDotProps) => {
  return (
    <Badge
      variant="outline"
      className={cn("whitespace-nowrap font-medium", getQuoteStatusColor(status), className)}
    >
      {getQuoteStatusLabel(status)}
    </Badge>
  );
};