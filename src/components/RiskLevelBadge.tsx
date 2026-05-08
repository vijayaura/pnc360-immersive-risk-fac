import { Badge } from '@/components/ui/badge';
import { getRiskLevelShade } from '@/features/market-admin/risk-categorisation/utils/riskCategorisation';

export function RiskLevelBadge(props: {
  label: string | null | undefined;
  index: number | null | undefined;
  total: number | null | undefined;
}) {
  const { label, index, total } = props;
  const safeLabel = label && String(label).trim() ? String(label).trim() : '-';
  const shade =
    typeof index === 'number' && typeof total === 'number'
      ? getRiskLevelShade(index, total)
      : 'bg-gray-100 text-gray-800';

  return <Badge className={shade}>{safeLabel}</Badge>;
}

