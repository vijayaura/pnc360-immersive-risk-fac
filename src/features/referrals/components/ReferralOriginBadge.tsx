import { Badge } from '@/components/ui/badge';
import { Zap, UserPlus } from 'lucide-react';

type Props = { triggerSourceType: string | null | undefined };

export const ReferralOriginBadge = ({ triggerSourceType }: Props) => {
    const isManual = String(triggerSourceType ?? '').toLowerCase() === 'manual';
    const label = isManual ? 'Manual Quote' : 'Auto-Quote';
    const Icon = isManual ? UserPlus : Zap;
    return (
        <Badge
            variant="outline"
            className={
                isManual
                    ? 'flex items-center gap-1 border-amber-300 bg-amber-50 text-amber-700'
                    : 'flex items-center gap-1 border-sky-300 bg-sky-50 text-sky-700'
            }
        >
            <Icon className="h-3 w-3" />
            {label}
        </Badge>
    );
};
