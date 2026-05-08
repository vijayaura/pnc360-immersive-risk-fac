import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'; // Corrected import path

import { formatCurrency } from '@/shared/utils/lib-utils';
import { Checkbox } from '@/components/ui/checkbox';
import type { ProductSection } from '@/features/product-config/api/products';
import type {
  PremiumBreakdown,
  CoverPremiumItem,
  PremiumUnitBreakdown,
} from '@/features/quotes/api/quotes';

export const PremiumCalculationSummaryContent = ({
  premium,
  currency,
  showPremiumSummaryFormulas,
  productSections,
  showCheckboxes = true,
}: {
  premium: PremiumBreakdown | null;
  currency: string;
  showPremiumSummaryFormulas: boolean;
  productSections: ProductSection[];
  showCheckboxes?: boolean;
}) => {
  const topLevelCovers = React.useMemo<CoverPremiumItem[]>(
    () => (Array.isArray(premium?.covers) ? (premium?.covers as CoverPremiumItem[]) : []),
    [premium?.covers],
  );

  const units = React.useMemo(() => {
    if (Array.isArray(premium?.units) && premium.units.length > 0) {
      return premium.units;
    }

    // Fallback for responses where units are present only inside covers.
    const derived = new Map<string, PremiumUnitBreakdown>();

    topLevelCovers.forEach((cover) => {
      const coverUnits = Array.isArray(cover.units) ? cover.units : [];
      coverUnits.forEach((unit, index) => {
        const unitKey = `${unit.rowIndex ?? index}-${unit.rowLabel ?? unit.firstColumnValue ?? ''}`;
        const existing = derived.get(unitKey);
        const unitCover = {
          coverId: cover.coverId,
          sumInsured: Number(unit.sumInsured || 0),
          premium: Number(unit.premium || 0),
          taxAmount: Number(unit.taxAmount || 0),
          netPremium: Number(unit.netPremium || unit.premium || 0),
          sumInsuredFormula: unit.sumInsuredFormula,
          premiumFormula: unit.premiumFormula,
          name: cover.name,
          code: cover.code,
          sectionId: cover.sectionId,
          sectionName: cover.sectionName,
          sectionOrder: cover.sectionOrder,
        };

        if (!existing) {
          derived.set(unitKey, {
            rowIndex: unit.rowIndex ?? index,
            rowLabel: unit.rowLabel || '',
            firstColumnValue: unit.firstColumnValue,
            covers: [unitCover],
            sumInsured: Number(unit.sumInsured || 0),
            sumInsuredFormula: unit.sumInsuredFormula || '',
            base: Number(unit.netPremium || unit.premium || 0),
            baseFormula: '',
            loading: 0,
            loadingFormula: '',
            discount: 0,
            discountFormula: '',
            fee: 0,
            total: Number(unit.netPremium || unit.premium || 0),
          });
          return;
        }

        existing.covers.push(unitCover);
        existing.sumInsured = Number(existing.sumInsured || 0) + Number(unit.sumInsured || 0);
        existing.total = Number(existing.total || 0) + Number(unit.netPremium || unit.premium || 0);
      });
    });

    return Array.from(derived.values()).sort((a, b) => a.rowIndex - b.rowIndex);
  }, [premium?.units, topLevelCovers]);
  const unitsCount = premium?.unitsCount ?? units.length ?? 0;
  const totalPremium = premium?.total ?? 0;
  const totalSumInsured = premium?.sumInsured ?? 0;

  const singularizeLabel = (label: string): string => {
    const s = label.trim();
    if (!s) return '';
    const lower = s.toLowerCase();
    if (lower.endsWith('ies') && s.length > 3) {
      return `${s.slice(0, -3)}y`;
    }
    const lower2 = s.toLowerCase();
    const esEndings = ['ches', 'shes', 'xes', 'zes', 'sses'];
    if (esEndings.some((end) => lower2.endsWith(end)) && s.length > 2) {
      return s.slice(0, -2);
    }
    if (lower.endsWith('ss')) {
      return s;
    }
    if (lower.endsWith('s') && s.length > 1) {
      return s.slice(0, -1);
    }
    return s;
  };

  const baseUnitLabelRaw =
    typeof premium?.combinationFirstColumnLabel === 'string' &&
    premium.combinationFirstColumnLabel.trim()
      ? premium.combinationFirstColumnLabel.trim()
      : 'Unit';
  const singularUnitLabel = singularizeLabel(baseUnitLabelRaw) || 'Unit';
  const pluralizeLabel = (label: string): string => {
    const s = label.trim();
    if (!s) return '';
    const lower = s.toLowerCase();
    if (lower.endsWith('y') && s.length > 1) return `${s.slice(0, -1)}ies`;
    if (lower.endsWith('s')) return s;
    return `${s}s`;
  };
  const pluralUnitLabel = pluralizeLabel(singularUnitLabel) || 'Units';

  const indexToLetters = (index: number): string => {
    let n = Math.floor(index);
    if (!Number.isFinite(n) || n < 0) return '';
    n += 1;
    let result = '';
    while (n > 0) {
      const rem = (n - 1) % 26;
      result = String.fromCharCode(65 + rem) + result;
      n = Math.floor((n - 1) / 26);
    }
    return result;
  };

  const formatRatingInputValue = (ri: {
    valueNumber?: number;
    valueBoolean?: boolean;
    valueString?: string;
    rawValue?: unknown;
  }): string => {
    if (typeof ri.valueNumber === 'number')
      return new Intl.NumberFormat(undefined, {
        maximumFractionDigits: 2,
      }).format(ri.valueNumber);
    if (typeof ri.valueBoolean === 'boolean') {
      return ri.valueBoolean ? 'Yes' : 'No';
    }
    if (typeof ri.valueString === 'string' && ri.valueString.trim()) {
      return ri.valueString.trim();
    }
    const raw = ri.rawValue;
    if (raw === undefined || raw === null) return '';
    if (typeof raw === 'string') return raw;
    if (typeof raw === 'number' || typeof raw === 'boolean') return String(raw);
    if (typeof raw === 'object') {
      const record = raw as Record<string, unknown>;
      if ('value' in record) {
        const v = record.value;
        return v === undefined || v === null ? '' : String(v);
      }
      if ('label' in record) {
        const v = record.label;
        return v === undefined || v === null ? '' : String(v);
      }
    }
    return JSON.stringify(raw);
  };

  const averageRatePerMil =
    typeof totalSumInsured === 'number' && totalSumInsured > 0
      ? (Number(totalPremium) / Number(totalSumInsured)) * 1000
      : 0;

  const groupCoversBySection = (covers: CoverPremiumItem[]) => {
    const coverToSection = new Map<string, { id?: string; name?: string; order?: number }>();
    for (const section of productSections) {
      const sectionId = section.id;
      const sectionName = section.name;
      const sectionOrder = section.order;
      for (const cover of section.covers || []) {
        if (!cover.id) continue;
        coverToSection.set(cover.id, {
          id: sectionId,
          name: sectionName,
          order: sectionOrder,
        });
      }
    }

    const groups = new Map<
      string,
      {
        sectionId?: string;
        sectionName: string;
        order: number;
        covers: CoverPremiumItem[];
        sectionPremium: number;
        sectionSumInsured: number;
      }
    >();

    for (const cover of covers) {
      const mapped = coverToSection.get(cover.coverId);
      const sectionId = cover.sectionId ?? mapped?.id ?? undefined;
      const sectionName = cover.sectionName ?? mapped?.name ?? 'Other';
      const order =
        typeof cover.sectionOrder === 'number'
          ? cover.sectionOrder
          : typeof mapped?.order === 'number'
            ? mapped.order
            : 999;

      const key = sectionId || sectionName;
      const existing = groups.get(key);
      const net = Number(cover.netPremium || 0);
      const si = Number(cover.sumInsured || 0);

      if (!existing) {
        groups.set(key, {
          sectionId,
          sectionName,
          order,
          covers: [cover],
          sectionPremium: net,
          sectionSumInsured: si,
        });
      } else {
        existing.covers.push(cover);
        existing.sectionPremium += net;
        existing.sectionSumInsured += si;
      }
    }

    const sections = Array.from(groups.values()).sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.sectionName.localeCompare(b.sectionName);
    });

    return sections.map((s) => ({
      ...s,
      covers: s.covers.slice().sort((a, b) => {
        const an = a.name || a.code || a.coverId;
        const bn = b.name || b.code || b.coverId;
        return an.localeCompare(bn);
      }),
      sectionPremium: Number(s.sectionPremium || 0),
      sectionSumInsured: Number(s.sectionSumInsured || 0),
    }));
  };

  const hasUnits = units.length > 0;
  const hasCovers = topLevelCovers.length > 0;

  const sectionsFromCovers = hasCovers ? groupCoversBySection(topLevelCovers) : [];
  const coversPremiumTotal = sectionsFromCovers.reduce(
    (acc, s) => acc + Number(s.sectionPremium || 0),
    0,
  );
  const coversSumInsuredTotal = sectionsFromCovers.reduce(
    (acc, s) => acc + Number(s.sectionSumInsured || 0),
    0,
  );

  const getUnitTitle = React.useCallback(
    (u: NonNullable<PremiumBreakdown['units']>[number], index: number): string =>
      typeof u.firstColumnValue === 'string' && u.firstColumnValue.trim()
        ? u.firstColumnValue.trim()
        : u.rowLabel || `${singularUnitLabel} ${indexToLetters(index)}`,
    [singularUnitLabel],
  );

  const getUnitKey = (u: NonNullable<PremiumBreakdown['units']>[number]): string =>
    `${u.rowIndex}-${u.rowLabel}`;

  const coverUnitRowsByCoverId = React.useMemo(() => {
    const out: Record<
      string,
      Array<{ unitKey: string; unitTitle: string; premium: number; sumInsured: number }>
    > = {};
    for (let index = 0; index < units.length; index += 1) {
      const u = units[index];
      const unitKey = getUnitKey(u);
      const unitTitle = getUnitTitle(u, index);
      const unitCovers = Array.isArray(u.covers) ? u.covers : [];
      for (const uc of unitCovers) {
        const coverId = String(uc.coverId || '').trim();
        if (!coverId) continue;
        const row = {
          unitKey,
          unitTitle,
          premium: Number(uc.netPremium || 0),
          sumInsured: Number(uc.sumInsured || 0),
        };
        if (row.premium === 0 && row.sumInsured === 0) continue;
        if (!out[coverId]) out[coverId] = [];
        out[coverId].push(row);
      }
    }
    return out;
  }, [getUnitTitle, units]);

  const [checkedUnitsByCover, setCheckedUnitsByCover] = React.useState<
    Record<string, Record<string, boolean>>
  >({});

  React.useEffect(() => {
    const next: Record<string, Record<string, boolean>> = {};
    Object.entries(coverUnitRowsByCoverId).forEach(([coverId, rows]) => {
      next[coverId] = {};
      rows.forEach((r) => {
        next[coverId][r.unitKey] = true;
      });
    });
    setCheckedUnitsByCover(next);
  }, [premium, coverUnitRowsByCoverId]);

  const isUnitChecked = (coverId: string, unitKey: string): boolean =>
    checkedUnitsByCover[coverId]?.[unitKey] ?? true;

  const toggleUnitChecked = (coverId: string, unitKey: string, checked: boolean) => {
    setCheckedUnitsByCover((prev) => ({
      ...prev,
      [coverId]: {
        ...(prev[coverId] || {}),
        [unitKey]: checked,
      },
    }));
  };

  const getCoverDisplayTotals = (cover: CoverPremiumItem) => {
    const rows = coverUnitRowsByCoverId[cover.coverId] || [];
    if (rows.length === 0) {
      return {
        premium: Number(cover.netPremium || 0),
        sumInsured: Number(cover.sumInsured || 0),
      };
    }
    const selected = rows.filter((r) => isUnitChecked(cover.coverId, r.unitKey));
    return {
      premium: selected.reduce((acc, r) => acc + Number(r.premium || 0), 0),
      sumInsured: selected.reduce((acc, r) => acc + Number(r.sumInsured || 0), 0),
    };
  };

  return (
    <div className="space-y-6 mt-4">
      {!hasUnits && hasCovers && (
        <>
          <Card className="relative border-primary/20 bg-primary/[0.04] shadow-sm overflow-hidden">
            <div className="h-1 w-full bg-primary/30" />
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Final Premium
                  </div>
                  <div className="text-2xl font-bold text-primary leading-tight">
                    {formatCurrency(coversPremiumTotal, currency)}
                  </div>
                </div>
                <div className="text-right pl-4 border-l border-primary/20">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Total Sum Insured
                  </div>
                  <div className="text-xl font-semibold text-foreground leading-tight">
                    {formatCurrency(coversSumInsuredTotal, currency)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {sectionsFromCovers.map((section) => (
              <Card
                key={section.sectionId || section.sectionName}
                className="border-border/70 border-l-4 border-l-primary/40 shadow-sm overflow-hidden ring-1 ring-primary/10"
              >
                <CardHeader className="px-3 py-2 bg-muted/10 border-b border-border/60">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Section
                      </div>
                      <CardTitle className="text-sm font-semibold tracking-tight">
                        {section.sectionName}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-3 text-[11px]">
                      <div className="flex items-center gap-1 whitespace-nowrap rounded-md bg-muted/40 px-2 py-1">
                        <span className="uppercase tracking-wide text-muted-foreground">SI</span>
                        <span className="font-semibold">
                          {formatCurrency(section.sectionSumInsured, currency)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 whitespace-nowrap rounded-md bg-primary/10 px-2 py-1">
                        <span className="uppercase tracking-wide text-muted-foreground">
                          Premium
                        </span>
                        <span className="font-semibold text-primary">
                          {formatCurrency(section.sectionPremium, currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-0 py-0">
                  <Table className="table-fixed">
                    <TableHeader>
                      <TableRow className="bg-muted/5">
                        <TableHead className="pl-4 py-2 h-9 text-[11px] uppercase tracking-wide text-muted-foreground">
                          Cover
                        </TableHead>
                        <TableHead className="text-right w-44 py-2 h-9 text-[11px] uppercase tracking-wide text-muted-foreground">
                          Sum Insured
                        </TableHead>
                        <TableHead className="text-right w-44 py-2 h-9 text-[11px] uppercase tracking-wide text-muted-foreground">
                          Premium
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {section.covers.map((cover, coverIndex) => (
                        <TableRow
                          key={cover.coverId}
                          className={`bg-muted/[0.03] transition-colors hover:bg-muted/15 ${coverIndex < section.covers.length - 1 ? 'border-b border-border/50' : ''}`}
                        >
                          <TableCell className="font-semibold pl-4 py-2 align-middle">
                            <span className="inline-flex items-center gap-2 border-l-2 border-primary/45 pl-3">
                              <span className="h-2 w-2 rounded-full bg-primary/60" />
                              <span>{cover.name || cover.code || cover.coverId}</span>
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-semibold w-44 py-2 align-middle whitespace-nowrap tabular-nums">
                            {formatCurrency(Number(cover.sumInsured || 0), currency)}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-primary w-44 py-2 align-middle whitespace-nowrap tabular-nums">
                            {formatCurrency(Number(cover.netPremium || 0), currency)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {hasUnits && !hasCovers && (
        <>
          <Card className="relative border-primary/20 bg-primary/[0.04] shadow-sm overflow-hidden">
            <div className="h-1 w-full bg-primary/30" />
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Total Policy Premium
                  </p>
                  <p className="text-2xl font-bold text-primary leading-tight">
                    {formatCurrency(totalPremium, currency)}
                  </p>
                </div>
                <div className="text-right pl-4 border-l border-primary/20">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Average Rate Per Mil
                  </p>
                  <p className="text-lg font-semibold leading-tight">
                    {new Intl.NumberFormat(undefined, {
                      minimumFractionDigits: 4,
                      maximumFractionDigits: 4,
                    }).format(averageRatePerMil)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Total Sum Insured</p>
              <p className="text-xl font-semibold">{formatCurrency(totalSumInsured, currency)}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">{`Number of ${pluralUnitLabel}`}</p>
              <p className="text-xl font-semibold">{unitsCount}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">{`${singularUnitLabel} Count`}</p>
              <p className="text-xl font-semibold">{units.length}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">{`${pluralUnitLabel} Breakdown`}</h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/5">
                    <TableHead className="w-1/2 text-[11px] uppercase tracking-wide text-muted-foreground">
                      {singularUnitLabel}
                    </TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Details
                    </TableHead>
                    <TableHead className="text-right text-[11px] uppercase tracking-wide text-muted-foreground">
                      Sum Insured
                    </TableHead>
                    <TableHead className="text-right text-[11px] uppercase tracking-wide text-muted-foreground">
                      Premium
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {units.map((u, index) => {
                    const isLastUnit = index === units.length - 1;
                    const unitTitle = getUnitTitle(u, index);
                    const total = Number(u.total || 0);
                    const sumInsured = Number(u.sumInsured || 0);
                    const inputs =
                      (u.premiumInputs && u.premiumInputs.length > 0
                        ? u.premiumInputs
                        : u.ratingInputs) || [];

                    return (
                      <React.Fragment key={`${u.rowIndex}-${u.rowLabel}`}>
                        <TableRow
                          className={`transition-colors hover:bg-muted/15 ${
                            !isLastUnit || inputs.length > 0 ? 'border-b border-border/40' : ''
                          }`}
                        >
                          <TableCell className="font-semibold">{unitTitle}</TableCell>
                          <TableCell>
                            {showPremiumSummaryFormulas && u.sumInsuredFormula && (
                              <div className="text-[11px] text-muted-foreground">
                                <span className="font-semibold text-foreground">SI Formula:</span>{' '}
                                {u.sumInsuredFormula}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(sumInsured, currency)}
                          </TableCell>
                          <TableCell className="text-right font-bold text-primary">
                            {formatCurrency(total, currency)}
                          </TableCell>
                        </TableRow>
                        {inputs.length > 0 && (
                          <TableRow
                            className={`transition-colors hover:bg-muted/10 ${!isLastUnit ? 'border-b' : ''}`}
                          >
                            <TableCell colSpan={4} className="px-8 py-2">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                {inputs.map((ri) => {
                                  const value = formatRatingInputValue(ri);
                                  return (
                                    <div key={ri.fieldId} className="min-w-0">
                                      <div className="text-[11px] text-muted-foreground truncate">
                                        {ri.fieldLabel}
                                      </div>
                                      <div className="text-sm font-medium truncate">{value}</div>
                                    </div>
                                  );
                                })}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}

      {hasUnits && hasCovers && (
        <>
          <Card className="relative border-primary/20 bg-primary/[0.04] shadow-sm overflow-hidden">
            <div className="h-1 w-full bg-primary/30" />
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Total Policy Premium
                  </div>
                  <div className="text-2xl font-bold text-primary leading-tight">
                    {formatCurrency(totalPremium, currency)}
                  </div>
                </div>
                <div className="text-right pl-4 border-l border-primary/20">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Total Sum Insured
                  </div>
                  <div className="text-xl font-semibold text-foreground leading-tight">
                    {formatCurrency(totalSumInsured, currency)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {sectionsFromCovers.map((section) => {
              const sectionDisplayTotals = section.covers.reduce(
                (acc, cover) => {
                  const totals = getCoverDisplayTotals(cover);
                  return {
                    premium: acc.premium + totals.premium,
                    sumInsured: acc.sumInsured + totals.sumInsured,
                  };
                },
                { premium: 0, sumInsured: 0 },
              );
              return (
                <Card
                  key={section.sectionId || section.sectionName}
                  className="border-border/70 border-l-4 border-l-primary/40 shadow-sm overflow-hidden ring-1 ring-primary/10"
                >
                  <CardHeader className="px-3 py-2 bg-muted/10 border-b border-border/60">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Section
                        </div>
                        <CardTitle className="text-sm font-semibold tracking-tight">
                          {section.sectionName}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-3 text-[11px]">
                        <div className="flex items-center gap-1 whitespace-nowrap rounded-md bg-muted/40 px-2 py-1">
                          <span className="uppercase tracking-wide text-muted-foreground">
                            Sum Insured
                          </span>
                          <span className="font-semibold">
                            {formatCurrency(sectionDisplayTotals.sumInsured, currency)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 whitespace-nowrap rounded-md bg-primary/10 px-2 py-1">
                          <span className="uppercase tracking-wide text-muted-foreground">
                            Premium
                          </span>
                          <span className="font-semibold text-primary">
                            {formatCurrency(sectionDisplayTotals.premium, currency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-0 py-0">
                    <Table className="table-fixed">
                      <TableHeader>
                        <TableRow className="bg-muted/5">
                          <TableHead className="pl-4 py-2 h-5 uppercase tracking-wide text-muted-foreground">{`Cover / ${singularUnitLabel}`}</TableHead>
                          <TableHead className="text-right w-44 py-2 h-5 uppercase tracking-wide text-muted-foreground">
                            Sum Insured
                          </TableHead>
                          <TableHead className="text-right w-44 py-2 h-5 uppercase tracking-wide text-muted-foreground">
                            Premium
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {section.covers.map((cover, coverIndex) => {
                          const coverTitle = cover.name || cover.code || cover.coverId;
                          const isLastCover = coverIndex === section.covers.length - 1;
                          const unitRows = coverUnitRowsByCoverId[cover.coverId] || [];
                          const coverDisplayTotals = getCoverDisplayTotals(cover);

                          if (
                            unitRows.length === 0 &&
                            Number(coverDisplayTotals.premium || 0) === 0 &&
                            Number(coverDisplayTotals.sumInsured || 0) === 0
                          ) {
                            return null;
                          }

                          return (
                            <React.Fragment key={cover.coverId}>
                              <TableRow
                                className={`bg-primary/[0.05] transition-colors hover:bg-primary/[0.08] ${
                                  !isLastCover || unitRows.length > 0
                                    ? 'border-b border-border/40'
                                    : ''
                                }`}
                              >
                                <TableCell className="font-semibold pl-4 py-2 align-middle">
                                  <span className="inline-flex items-center gap-2 border-l-2 border-primary/50 pl-3">
                                    <span className="h-2 w-2 rounded-full bg-primary/70" />
                                    <span>{coverTitle}</span>
                                  </span>
                                </TableCell>
                                <TableCell className="text-right font-semibold w-44 py-2 align-middle whitespace-nowrap tabular-nums">
                                  {formatCurrency(
                                    Number(coverDisplayTotals.sumInsured || 0),
                                    currency,
                                  )}
                                </TableCell>
                                <TableCell className="text-right font-semibold text-primary w-44 py-2 align-middle whitespace-nowrap tabular-nums">
                                  {formatCurrency(
                                    Number(coverDisplayTotals.premium || 0),
                                    currency,
                                  )}
                                </TableCell>
                              </TableRow>
                              {unitRows.map((r, unitIndex) => (
                                <TableRow
                                  key={r.unitKey}
                                  className={`transition-colors hover:bg-muted/10 ${
                                    !isLastCover && unitIndex === unitRows.length - 1
                                      ? 'border-b'
                                      : ''
                                  }`}
                                >
                                  <TableCell className="pl-12 py-1.5 text-muted-foreground">
                                    <span className="inline-flex items-center gap-2 border-l-2 border-muted-foreground/40 pl-3">
                                      {showCheckboxes && (
                                        <Checkbox
                                          checked={isUnitChecked(cover.coverId, r.unitKey)}
                                          onCheckedChange={(checked) =>
                                            toggleUnitChecked(
                                              cover.coverId,
                                              r.unitKey,
                                              Boolean(checked),
                                            )
                                          }
                                        />
                                      )}
                                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                                      {r.unitTitle}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right text-muted-foreground w-44 py-1.5 whitespace-nowrap tabular-nums">
                                    {formatCurrency(
                                      isUnitChecked(cover.coverId, r.unitKey) ? r.sumInsured : 0,
                                      currency,
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right text-muted-foreground w-44 py-1.5 whitespace-nowrap tabular-nums">
                                    {formatCurrency(
                                      isUnitChecked(cover.coverId, r.unitKey) ? r.premium : 0,
                                      currency,
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </React.Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {!hasUnits && !hasCovers && (
        <Card className="border">
          <CardContent className="p-4 text-sm text-muted-foreground">
            No premium breakup summary available for this quote.
          </CardContent>
        </Card>
      )}
    </div>
  );
};
