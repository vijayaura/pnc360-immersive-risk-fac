import { Badge } from '@/components/ui/badge';
import { RiskLevelBadge } from '@/components/RiskLevelBadge';
import type { SelectedRiskDetail } from '@/types/selected-risk';

const titleCase = (s: string) =>
  s
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

export function SelectedRisksPanel(props: {
  title?: string;
  subtitle?: string;
  items: SelectedRiskDetail[];
}) {
  const { title, subtitle, items } = props;
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <div className="rounded-lg border bg-white overflow-hidden">
      <div className="px-4 py-3 border-b bg-muted/30">
        <div className="text-sm font-semibold">{title || 'Triggered Risk Levels'}</div>
        {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
      </div>
      <div className="divide-y">
        {items.map((r, idx) => (
          <div key={`${r.coverId}:${r.riskLevelId}:${idx}`} className="px-4 py-3">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-2">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Risk Category</div>
                <div className="text-sm font-medium">{r.riskCategoryTitle || r.riskCategoryId}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Cover</div>
                <div className="text-sm font-medium">{r.coverTitle || r.coverId}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Unit</div>
                <div className="text-sm font-medium">{r.unitId || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Risk Level</div>
                <div className="text-sm font-medium">
                  <RiskLevelBadge
                    label={r.riskLevelLabel || r.riskLevelId}
                    index={r.riskLevelIndex}
                    total={r.riskLevelCount}
                  />
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Pricing Configuration</div>
                <div className="text-sm font-medium">
                  {r.adjustmentType && r.adjustmentValue != null
                    ? `${titleCase(String(r.adjustmentType).toLowerCase())}: ${r.adjustmentValue}`
                    : '-'}
                </div>
                {r.quoteAction && (
                  <div className="mt-1">
                    <Badge
                      variant={
                        r.quoteAction.toUpperCase() === 'NO_QUOTE'
                          ? 'destructive'
                          : r.quoteAction.toUpperCase() === 'REFERRAL'
                            ? 'secondary'
                            : 'outline'
                      }
                    >
                      {titleCase(String(r.quoteAction))}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
