import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { getRiskLevelShade } from '@/features/market-admin/risk-categorisation/utils/riskCategorisation';

type RiskLevel = any;

interface BreakdownUnit {
  id: string;
  label: string;
  sumInsured?: number | null;
  premium?: number | null;
}

interface BreakdownCover {
  id: string;
  title: string;
  units: BreakdownUnit[];
}

interface BreakdownSection {
  id: string;
  title: string;
  covers: BreakdownCover[];
}

export interface ProjectBreakdownWithRiskLevelsProps {
  totalSumInsured?: number;
  finalPremium?: number;
  totalPremium?: number;
  projectBreakdown?: BreakdownSection[] | null;
  collapsible?: boolean;
  selectedCoverIds?: Set<string> | null;
}

const getRiskLevelForUnit = (sumInsured: number): RiskLevel => {
  if (sumInsured >= 3000000) return 'High';
  if (sumInsured >= 1500000) return 'Medium';
  return 'Low';
};

const formatAmount = (value: number | null | undefined) =>
  typeof value === 'number' ? `${value.toLocaleString()} AED` : '-';

export function ProjectBreakdownWithRiskLevels({
  totalSumInsured,
  finalPremium,
  totalPremium,
  projectBreakdown,
  collapsible = false,
  selectedCoverIds = null,
}: ProjectBreakdownWithRiskLevelsProps) {
  const sections = useMemo(
    () => (Array.isArray(projectBreakdown) ? projectBreakdown : []),
    [projectBreakdown],
  );
  const [isExpanded, setIsExpanded] = useState(false);

  const { computedSumInsured, computedPremium, hasAnyAmount } = useMemo(() => {
    return sections.reduce(
      (acc, section) => {
        section.covers.forEach((cover) => {
          if (selectedCoverIds && !selectedCoverIds.has(cover.id)) return;
          cover.units.forEach((unit) => {
            if (typeof unit.sumInsured === 'number') {
              acc.computedSumInsured += unit.sumInsured;
              acc.hasAnyAmount = true;
            }
            if (typeof unit.premium === 'number') {
              acc.computedPremium += unit.premium;
              acc.hasAnyAmount = true;
            }
          });
        });
        return acc;
      },
      { computedSumInsured: 0, computedPremium: 0, hasAnyAmount: false },
    );
  }, [sections, selectedCoverIds]);

  const finalSumInsured = totalSumInsured ?? computedSumInsured;
  const finalPremiumAmount = finalPremium ?? totalPremium ?? computedPremium;
  const hasProvidedPremium = finalPremium !== undefined || totalPremium !== undefined;
  const hasProjectBreakdown = sections.length > 0;

  return (
    <Card className="border-border">
      <CardHeader
        className={collapsible ? 'pb-3 cursor-pointer' : 'pb-3'}
        onClick={collapsible ? () => setIsExpanded((prev) => !prev) : undefined}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Product Breakdown
            </CardTitle>
          </div>
          {collapsible &&
            (isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ))}
        </div>
      </CardHeader>
      {(!collapsible || isExpanded) && (
      <CardContent className="space-y-4 pt-0">
        {hasProjectBreakdown ? (
          <div className="space-y-4">
            {sections.map((section) => (
              <Card key={section.id}>
                <CardHeader className="pb-3">
                  <h3 className="text-base font-semibold">{section.title}</h3>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  {section.covers.map((cover) => (
                    <Card key={cover.id} className="border-muted/50">
                      <CardHeader className="py-3 px-4">
                        <h4 className="text-sm font-medium text-muted-foreground">{cover.title}</h4>
                      </CardHeader>
                      <CardContent className="pt-0 px-4 pb-4 space-y-3">
                        {cover.units.map((unit, unitIndex) => {
                          const riskLevel =
                            unit.label ||
                            (typeof unit.sumInsured === 'number'
                              ? getRiskLevelForUnit(unit.sumInsured)
                              : null);
                          return (
                            <Card key={unit.id} className="border-muted/50 bg-muted/5">
                              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="space-y-1">
                                  <p className="font-medium text-sm">{unit.label}</p>
                                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                    <span>
                                      <span className="font-medium text-foreground">Sum Insured:</span>{' '}
                                      {formatAmount(unit.sumInsured)}
                                    </span>
                                    <span>
                                      <span className="font-medium text-foreground">Premium:</span>{' '}
                                      {formatAmount(unit.premium)}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
                                  <span className="text-xs text-muted-foreground">Risk Level</span>
                                  {riskLevel ? (
                                    <Badge
                                      className={`${getRiskLevelShade(unitIndex, cover.units.length)} capitalize`}
                                    >
                                      {riskLevel}
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline">N/A</Badge>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed bg-muted/10 px-4 py-6 text-sm text-muted-foreground">
            No project breakdown available.
          </div>
        )}

        {hasProjectBreakdown && (
          <div className="rounded-lg border bg-muted/20 p-4 flex flex-wrap gap-6">
            <div>
              <span className="text-sm text-muted-foreground">Total Sum Insured</span>
              <p className="text-lg font-semibold">
                {totalSumInsured !== undefined || hasAnyAmount
                  ? `${finalSumInsured.toLocaleString()} AED`
                  : '-'}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Final Premium</span>
              <p className="text-lg font-semibold">
                {hasProvidedPremium || hasAnyAmount ? `${finalPremiumAmount.toLocaleString()} AED` : '-'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
      )}
    </Card>
  );
}
