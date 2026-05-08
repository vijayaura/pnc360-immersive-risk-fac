import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/shared/utils/lib-utils';

interface StatusBadgeProps {
    status: string;
    compact?: boolean;
}

export const StatusBadge = React.memo(({ status, compact }: StatusBadgeProps) => {
    const s = (status || '').trim();
    const searchStatus = s.toLowerCase().replace(/_/g, ' ');

    const statusConfig: Record<
        string,
        { color: string; icon: any }
    > = {
        open: { color: 'bg-primary/10 text-primary border-primary/20', icon: Clock },
        'in review': { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Clock },
        'query raised': { color: 'bg-orange-50 text-orange-700 border-orange-200', icon: MessageSquare },
        responded: { color: 'bg-warning/10 text-warning border-warning/30', icon: MessageSquare },
        approved: { color: 'bg-success/10 text-success border-success/30', icon: CheckCircle },
        'approved with conditions': { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
        declined: { color: 'bg-destructive/10 text-destructive border-destructive/20', icon: AlertCircle },
        closed: { color: 'bg-success/20 text-success border-success/40', icon: CheckCircle },
    };

    const config = statusConfig[searchStatus] || { color: 'bg-muted text-muted-foreground border-border', icon: AlertCircle };
    const Icon = config.icon;

    return (
        <Badge variant="outline" className={cn(
            "flex items-center gap-1.5 font-semibold w-fit whitespace-nowrap",
            compact ? "text-xs px-2 py-0.5" : "px-3 py-1",
            config.color
        )}>
            <Icon className={compact ? "w-3 h-3" : "w-3.5 h-3.5"} />
            {s || '-'}
        </Badge>
    );
});

interface PriorityBadgeProps {
    priority?: string | null;
}

export const PriorityBadge = React.memo(({ priority }: PriorityBadgeProps) => {
    if (!priority || priority === '-') return null;
    const priorityConfig: Record<string, { color: string }> = {
        Low: { color: 'bg-success/10 text-success border-success/30' },
        Medium: { color: 'bg-warning/10 text-warning border-warning/30' },
        High: { color: 'bg-destructive/10 text-destructive border-destructive/20' },
        Urgent: { color: 'bg-destructive/20 text-destructive border-destructive/30' },
    };

    const color = priorityConfig[priority]?.color || 'bg-muted text-muted-foreground border-border';
    return (
        <Badge variant="outline" className={cn("font-semibold px-2.5 py-0.5", color)}>
            {priority}
        </Badge>
    );
});
