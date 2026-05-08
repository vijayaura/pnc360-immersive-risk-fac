import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Save,
  Loader2,
  Plus,
  Trash2,
  Calculator,
  Edit,
  CheckCircle2,
  AlertTriangle,
  Search,
  X,
  ArrowDownAZ,
  ArrowUpZA,
} from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { getRatingParameters } from '@/features/product-config/pricing/api/ratings';
import { getProduct } from '@/features/product-config/api/products';
import { backendProductTypeToMode } from '@/features/product-config/utils/productMapping';
import {
  getProposalFormDesign,
  type Page as ProposalFormPage,
  type SubField,
} from '@/features/product-config/proposal-form/api/proposalFormDesign';
import {
  saveRatingFormula,
  getRatingFormulas,
  getRiskCategories,
  getRatingParameterDefinitions,
  saveRatingSelections,
  getRatingSelections,
  deleteRatingParameterDefinition,
  createRatingParameterDefinition,
  updateRatingParameterDefinition,
  type RatingParameterDefinitionDto,
  type RatingFormulaDto,
  type FormulaTokenPayload,
} from '@/features/product-config/pricing/api/ratings';

import { CalculationTabs } from '@/features/product-config/components/rating-configurator/CalculationTabs';
import { InlineFormulaBuilder } from '@/features/product-config/components/rating-configurator/InlineFormulaBuilder';
import { MatrixParametersPanel } from '@/features/product-config/components/rating-configurator/MatrixParametersPanel';
import {
  CombinationParametersPanel,
  type CombinationParameter,
} from '@/features/product-config/components/rating-configurator/CombinationParametersPanel';
import { RatingConfiguratorHeader } from '@/features/product-config/components/rating-configurator/RatingConfiguratorHeader';
import { RatingParameterTreeLayout } from '@/features/product-config/components/rating-configurator/RatingParameterTreeLayout';
import { StepNavigationButtons } from '@/features/product-config/components/rating-configurator/StepNavigationButtons';
import { StepProgress } from '@/features/product-config/components/rating-configurator/StepProgress';
import {
  buildFormulaTokens,
  evaluateFormula,
  reindexFormula,
} from '@/features/product-config/components/rating-configurator/formulaUtils';
import {
  flattenRatingParameters,
  isCombinationField,
} from '@/features/product-config/components/rating-configurator/parameterUtils';
import {
  CEW,
  CEWField,
  CEWPage,
  DefaultRatingParam,
  FormulaStep,
  MatrixParameter,
  MultiSelectRate,
  RangeBasedRate,
  RatingParameter,
  ValueBasedRate,
} from '@/features/product-config/components/rating-configurator/types';

const RatingConfigurator = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const productName = searchParams.get('productName') || 'Product';
  const productVersion = searchParams.get('productVersion') || '';
  const productId = searchParams.get('productId') || '';
  const [ratingParameters, setRatingParameters] = useState<RatingParameter[]>([]);
  const [isSavingSelections, setIsSavingSelections] = useState(false);
  const [ratingParameterDefinitions, setRatingParameterDefinitions] = useState<
    RatingParameterDefinitionDto[]
  >([]);
  const [proposalTemplatePages, setProposalTemplatePages] = useState<ProposalFormPage[]>([]);

  const mergeRatingParametersWithDefinitions = React.useCallback(
    (params: RatingParameter[], definitionDtos: RatingParameterDefinitionDto[]) => {
      const mergedParamMap = new Map<string, RatingParameter>();

      ([...params] as RatingParameter[]).forEach((param) => {
        const parameterType = String(param.parameterType || '').toUpperCase();
        const isDefinitionParameter =
          (parameterType === 'REFERENCE' ||
            parameterType === 'MATRIX' ||
            parameterType === 'COMBINATION') &&
          Boolean(param.definitionId);
        const key = isDefinitionParameter
          ? `def:${param.definitionId}`
          : `field:${param.formFieldId || param.id}:${param.derivedType || 'NONE'}:${param.derivedSubfieldId || ''}`;
        if (!mergedParamMap.has(key)) {
          mergedParamMap.set(key, param);
        }
      });

      (definitionDtos || []).forEach((definition) => {
        const key = `def:${definition.id}`;
        const definitionParam = {
          id: definition.id,
          definitionId: definition.id,
          formFieldId: definition.formFieldId || undefined,
          label: definition.label || definition.name || definition.id,
          name: definition.name || definition.id,
          type: 'number',
          parameterType: definition.parameterType,
          isDefinitionOnly: true,
          isActive: Boolean(definition.isActive),
          activeCategories: [],
          sources: definition.sources || [],
          ratingParameterId: undefined,
        } as RatingParameter;

        const existing = mergedParamMap.get(key);
        if (!existing) {
          mergedParamMap.set(key, definitionParam);
          return;
        }

        mergedParamMap.set(key, {
          ...existing,
          ...definitionParam,
          isDefinitionOnly: Boolean(existing.isDefinitionOnly),
          isActive: existing.isActive ?? definitionParam.isActive,
          activeCategories:
            existing.activeCategories && existing.activeCategories.length > 0
              ? existing.activeCategories
              : [],
          ratingParameterId: existing.ratingParameterId,
        });
      });

      const mergedParameters = Array.from(mergedParamMap.values());
      if (mergedParameters.length === 0) return [];

      return mergedParameters.sort((a, b) => {
        const aHasMasterId = Boolean(a.masterId);
        const bHasMasterId = Boolean(b.masterId);
        if (aHasMasterId === bHasMasterId) return 0;
        return aHasMasterId ? -1 : 1;
      });
    },
    [],
  );

  const refreshRatingParameters = React.useCallback(async () => {
    if (!productId) return;
    const [params, defs] = await Promise.all([
      getRatingParameters(productId),
      getRatingParameterDefinitions(productId).catch(() => []),
    ]);
    setRatingParameterDefinitions(defs);
    setRatingParameters(
      mergeRatingParametersWithDefinitions(params as unknown as RatingParameter[], defs),
    );
  }, [productId, mergeRatingParametersWithDefinitions]);
  const refreshSelections = React.useCallback(async () => {
    if (!productId) return;
    const res = await getRatingSelections(productId);
    const base = res.base || [];
    const factor = res.factor || [];
    const premiumLimit = res.premiumLimit || [];

    setDefaultRatingParamsList((prev) =>
      prev.map((p) => {
        if (p.id === 'base') return { ...p, selectedRatingParameters: base };
        if (p.id === 'factor') return { ...p, selectedRatingParameters: factor };
        if (p.id === 'premiumLimit') return { ...p, selectedRatingParameters: premiumLimit };
        return p;
      }),
    );
    lastSyncedRef.current = {
      base: [...base],
      factor: [...factor],
      premiumLimit: [...premiumLimit],
    };
  }, [productId]);

  const definitions = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        parameterType: string;
        formFieldId?: string;
      }
    >();

    for (const p of ratingParameters) {
      const definitionId = p.definitionId || p.id;
      if (!definitionId || map.has(definitionId)) continue;
      map.set(definitionId, {
        id: definitionId,
        name: p.label || p.name || definitionId,
        parameterType: p.parameterType || 'FORM_FIELD',
        formFieldId: p.formFieldId || undefined,
      });
    }

    return Array.from(map.values());
  }, [ratingParameters]);

  const proposalOriginalParameters = useMemo(() => {
    const items = (proposalTemplatePages || []).flatMap((page) =>
      (page.sections || []).flatMap((section) =>
        (section.fields || []).flatMap((field) => {
          const fieldLabel =
            String(field.label || '').trim() || String(field.name || '').trim() || String(field.id);
          const base = field.isRatingParameter
            ? [
                {
                  id: field.id || `${field.name}_${field.label}`,
                  label: fieldLabel,
                  type: field.type || 'text',
                },
              ]
            : [];
          const subs = (field.subFields || [])
            .filter((sub) => sub.isRatingParameter)
            .map((sub) => ({
              id: sub.id || `${field.id || field.name}_${sub.name}`,
              label:
                String(sub.label || '').trim() || String(sub.name || '').trim() || String(sub.id),
              type: sub.type || 'text',
            }));
          return [...base, ...subs];
        }),
      ),
    );
    const seen = new Set<string>();
    return items.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [proposalTemplatePages]);

  const proposalTreeRatingParameters = useMemo(() => {
    const items: RatingParameter[] = [];
    for (const page of proposalTemplatePages || []) {
      for (const section of page.sections || []) {
        for (const field of section.fields || []) {
          if (field.id) {
            const isCombination = String(field.type || '').toLowerCase() === 'combination';
            const fieldLabel =
              String(field.label || '').trim() ||
              String(field.name || '').trim() ||
              String(field.id);
            items.push({
              id: field.id,
              formFieldId: field.id,
              name: field.name || field.label || field.id,
              label: fieldLabel,
              type: field.type || 'text',
              parameterType: 'FORM_FIELD',
              isActive: false,
              isRatingParameter: Boolean(field.isRatingParameter),
              activeCategories: [],
              metadata: field.metadata || null,
              childFields: isCombination
                ? (field.subFields || [])
                    .filter((sub) => Boolean(sub.id))
                    .map((sub) => ({
                      id: sub.id!,
                      formFieldId: sub.id!,
                      parentFieldId: field.id,
                      name: sub.name || sub.label || sub.id!,
                      label:
                        String(sub.label || '').trim() ||
                        String(sub.name || '').trim() ||
                        String(sub.id),
                      type: sub.type || 'text',
                      parameterType: 'FORM_FIELD',
                      isActive: false,
                      isRatingParameter: Boolean(sub.isRatingParameter),
                      activeCategories: [],
                      metadata: sub.metadata || null,
                    }))
                : undefined,
            });
          }
          for (const sub of field.subFields || []) {
            if (sub.id) {
              const fieldLabel =
                String(field.label || '').trim() ||
                String(field.name || '').trim() ||
                String(field.id);
              items.push({
                id: sub.id,
                formFieldId: sub.id,
                parentFieldId: field.id,
                name: sub.name || sub.label || sub.id,
                label:
                  String(sub.label || '').trim() || String(sub.name || '').trim() || String(sub.id),
                type: sub.type || 'text',
                parameterType: 'FORM_FIELD',
                isActive: false,
                isRatingParameter: Boolean(sub.isRatingParameter),
                activeCategories: [],
                metadata: sub.metadata || null,
              });
            }
          }
        }
      }
    }
    const byId = new Map<string, RatingParameter>();
    for (const item of items) {
      if (!byId.has(item.id)) byId.set(item.id, item);
    }
    return Array.from(byId.values());
  }, [proposalTemplatePages]);

  const allAvailableParameters = useMemo(() => {
    const score = (p: RatingParameter) =>
      (p.isActive ? 100 : 0) +
      ((p.activeCategories?.length || 0) > 0 ? 10 : 0) +
      (p.ratingParameterId ? 5 : 0);

    const merged = [...proposalTreeRatingParameters, ...ratingParameters, ...definitions].map(
      (p_raw) => {
        const p = p_raw as RatingParameter;
        const parameterType = String(p.parameterType || '').toUpperCase();
        const isDefinitionParameter =
          (parameterType === 'REFERENCE' ||
            parameterType === 'MATRIX' ||
            parameterType === 'COMBINATION') &&
          Boolean(p.definitionId) &&
          !String(p.id || '').startsWith('derived|');
        if (!isDefinitionParameter) return p;
        return { ...p, id: p.definitionId! };
      },
    );

    const byId = new Map<string, RatingParameter>();
    for (const p_raw of merged) {
      const p = p_raw as RatingParameter;
      const key = String(p.id);
      if (!key) continue;
      const existing = byId.get(key);
      if (!existing) {
        byId.set(key, p);
        continue;
      }
      const preferred = score(p) > score(existing) ? p : existing;
      const fallback = preferred === p ? existing : p;
      byId.set(key, {
        ...preferred,
        parentFieldId: preferred.parentFieldId ?? fallback.parentFieldId,
        childFields:
          preferred.childFields && preferred.childFields.length > 0
            ? preferred.childFields
            : fallback.childFields,
      });
    }

    const flattened = flattenRatingParameters(Array.from(byId.values()));
    const seen = new Set<string>();
    return flattened.filter((param) => {
      const key = String(param.id);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [proposalTreeRatingParameters, ratingParameters, definitions]);

  const visibleOriginalParameters = useMemo(() => {
    const flattened = flattenRatingParameters(allAvailableParameters);
    return flattened.filter((p) => {
      if (p.deletedAt) return false;
      const pType = String(p.parameterType || '').toUpperCase();
      return (
        (pType === 'FORM_FIELD' || !pType) &&
        !String(p.id || '').startsWith('derived|') &&
        !p.isDefinitionOnly
      );
    });
  }, [allAvailableParameters]);

  const derivedDefinitionParameters = useMemo(() => {
    return (ratingParameterDefinitions || [])
      .filter((d) => String(d.parameterType || '').toUpperCase() === 'DERIVED')
      .map((d) => ({
        id: d.id,
        label: d.label || d.name || d.id,
        type: String(d.derivedType || 'DERIVED'),
      }));
  }, [ratingParameterDefinitions]);

  const multiUnitCombinationFieldOptions = useMemo(() => {
    const seenIds = new Set<string>();
    const options: { id: string; label: string }[] = [];

    proposalTreeRatingParameters
      .filter((param) => {
        if (!isCombinationField(param.type, param.parameterType)) return false;
        if (!param.isRatingParameter) return false;
        const metadata = param.metadata as { isCombinationPremium?: boolean | null } | undefined;
        return metadata?.isCombinationPremium === true;
      })
      .forEach((param) => {
        const id = param.formFieldId || param.id;
        if (id && !seenIds.has(id)) {
          seenIds.add(id);
          const label =
            (param as unknown as { formFieldLabel?: string }).formFieldLabel ||
            param.label ||
            param.name ||
            id;
          options.push({ id, label });
        }
      });

    return options;
  }, [proposalTreeRatingParameters]);
  const hasCombinationPremium = useMemo(
    () => multiUnitCombinationFieldOptions.length > 0,
    [multiUnitCombinationFieldOptions],
  );
  const referencedParameters = useMemo(() => {
    const refs = ratingParameters.filter((p) => p.parameterType === 'REFERENCE');
    const byKey = new Map<string, RatingParameter>();
    const normalize = (value: string) => value.trim().toLowerCase();
    const buildKey = (p: RatingParameter) => {
      const fieldKey = String(p.formFieldId || p.formFieldLabel || '').trim();
      const nameKey = normalize(String(p.label || p.name || ''));
      if (fieldKey && nameKey) return `${fieldKey}|${nameKey}`;
      if (nameKey) return `name|${nameKey}`;
      return String(p.definitionId || p.id);
    };
    const getScore = (p: RatingParameter) => (p.ratingParameterId ? 10 : 0) + (p.isActive ? 1 : 0);

    for (const p of refs) {
      const key = buildKey(p);
      const existing = byKey.get(key);
      if (!existing || getScore(p) > getScore(existing)) {
        byKey.set(key, p);
      }
    }

    return Array.from(byKey.values()).sort((a, b) =>
      String(a.label || a.name || '').localeCompare(String(b.label || b.name || '')),
    );
  }, [ratingParameters]);
  const combinationDefinitionParameters = useMemo(() => {
    const seen = new Set<string>();
    const items: CombinationParameter[] = [];
    for (const p of ratingParameters) {
      if (p.parameterType !== 'COMBINATION') continue;
      const key = p.definitionId || p.id;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const resolveToFormFieldId = (source: { type: string; id: string }) => {
        if (source.type === 'FORM_FIELD') return source.id;
        const byDefinitionId = ratingParameters.find(
          (rp) => rp.definitionId === source.id || rp.id === source.id,
        );
        return byDefinitionId?.formFieldId || byDefinitionId?.id || source.id;
      };
      items.push({
        ratingParameterId: p.definitionId || p.id,
        name: p.label || p.name || 'Combination Parameter',
        label: p.label || p.name || 'Combination Parameter',
        combinationParameterIds: (p.sources || [])
          .sort((a, b) => a.position - b.position)
          .map((s) => resolveToFormFieldId(s)),
      });
    }
    return items;
  }, [ratingParameters]);
  const [isLoadingRatingParameters, setIsLoadingRatingParameters] = useState(true);
  const [valueBasedRates, setValueBasedRates] = useState<ValueBasedRate[]>([]);
  const [rangeBasedRates, setRangeBasedRates] = useState<RangeBasedRate[]>([]);
  // Store value-based and range-based rates per parameter
  const [parameterValueBasedRates, setParameterValueBasedRates] = useState<
    Record<string, ValueBasedRate[]>
  >({});
  const [parameterRangeBasedRates, setParameterRangeBasedRates] = useState<
    Record<string, RangeBasedRate[]>
  >({});
  const [multiSelectRates, setMultiSelectRates] = useState<MultiSelectRate[]>([]);
  const [formulaSteps, setFormulaSteps] = useState<FormulaStep[]>([]);
  const [defaultRatingParamsList, setDefaultRatingParamsList] = useState<DefaultRatingParam[]>([
    { id: 'base', name: 'base', label: 'Choose Base Rate Parameters', value: 0 },
    { id: 'factor', name: 'factor', label: 'Choose Factors', value: 0 },
    {
      id: 'premiumLimit',
      name: 'premiumLimit',
      label: 'Choose Premium Limit Parameters',
      value: 0,
    },
    {
      id: 'brokerMinimumCommission',
      name: 'brokerMinimumCommission',
      label: 'Broker Minimum Commission (%)',
      value: 0,
    },
    {
      id: 'brokerMaximumCommission',
      name: 'brokerMaximumCommission',
      label: 'Broker Maximum Commission (%)',
      value: 0,
    },
  ]);

  const proposalFieldLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const page of proposalTemplatePages || []) {
      for (const section of page.sections || []) {
        for (const field of section.fields || []) {
          if (field.id) {
            const label =
              String(field.label || '').trim() || String(field.name || '').trim() || field.id;
            map.set(field.id, label);
          }
          for (const sf of field.subFields || []) {
            if (sf.id) {
              const label = String(sf.label || '').trim() || String(sf.name || '').trim() || sf.id;
              map.set(sf.id, label);
            }
          }
        }
      }
    }
    return map;
  }, [proposalTemplatePages]);

  const selectedRelativeParameters = useMemo(() => {
    const baseIds =
      defaultRatingParamsList.find((p) => p.id === 'base')?.selectedRatingParameters || [];
    const factorIds =
      defaultRatingParamsList.find((p) => p.id === 'factor')?.selectedRatingParameters || [];
    const premiumLimitIds =
      defaultRatingParamsList.find((p) => p.id === 'premiumLimit')?.selectedRatingParameters || [];

    const selectedIds = [...baseIds, ...factorIds, ...premiumLimitIds];
    if (selectedIds.length === 0) return [];

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUuid = (value: string) => uuidRegex.test(value.trim());

    const definitionById = new Map(ratingParameterDefinitions.map((d) => [d.id, d]));
    const seen = new Set<string>();
    const uniqueSelectedIds: string[] = [];
    for (const id of selectedIds) {
      if (!id || seen.has(id)) continue;
      seen.add(id);
      uniqueSelectedIds.push(id);
    }

    const resolveDefinitionLabel = (def: RatingParameterDefinitionDto): string => {
      const parameterType = String(def.parameterType || '').toUpperCase();
      const baseFieldLabel = def.formFieldId
        ? proposalFieldLabelById.get(def.formFieldId)
        : undefined;

      if (parameterType === 'FORM_FIELD') {
        const fromForm = baseFieldLabel;
        const raw = String(def.label || '').trim() || String(def.name || '').trim() || def.id;
        if (fromForm) return fromForm;
        if (!isUuid(raw)) return raw;
        return String(def.name || '').trim() || def.id;
      }

      if (parameterType === 'DERIVED') {
        const derivedType = String(def.derivedType || '').toUpperCase();
        const root =
          baseFieldLabel ||
          String(def.label || '').trim() ||
          String(def.name || '').trim() ||
          def.id;
        if (derivedType === 'COUNT') {
          return `${root} - Total Count`;
        }
        if (derivedType === 'SUM') {
          const subId = String(def.derivedSubfieldId || '').trim();
          const subLabel = subId ? proposalFieldLabelById.get(subId) || subId : '';
          return subLabel ? `${root} - Sum of ${subLabel}` : `${root} - Sum`;
        }
        return root;
      }

      const raw = String(def.label || '').trim() || String(def.name || '').trim() || def.id;
      if (!isUuid(raw)) return raw;
      const fromForm = baseFieldLabel;
      if (fromForm) return fromForm;
      return String(def.name || '').trim() || def.id;
    };

    const fromDefs = uniqueSelectedIds
      .map((id) => definitionById.get(id))
      .filter(Boolean)
      .map((def) => {
        const label = resolveDefinitionLabel(def);
        const name = String(def.name || '').trim() || label || def.id;
        return {
          id: def.id,
          definitionId: def.id,
          formFieldId: def.formFieldId || undefined,
          name,
          label,
          type: 'number',
          parameterType: def.parameterType,
          isDefinitionOnly: true,
          isActive: Boolean(def.isActive),
          derivedType: def.derivedType,
          derivedSubfieldId: def.derivedSubfieldId || undefined,
          sources: def.sources,
        } satisfies RatingParameter;
      });

    const resolvedIds = new Set(fromDefs.map((p) => p.id));
    const fromFallback = uniqueSelectedIds
      .filter((id) => !resolvedIds.has(id))
      .map((id) => allAvailableParameters.find((p) => p.id === id))
      .filter(Boolean);

    return [...fromDefs, ...fromFallback];
  }, [
    allAvailableParameters,
    defaultRatingParamsList,
    proposalFieldLabelById,
    ratingParameterDefinitions,
  ]);

  // Base Premium parameters - only shows Base selections
  const selectedBasePremiumParameters = useMemo(() => {
    const baseIds =
      defaultRatingParamsList.find((p) => p.id === 'base')?.selectedRatingParameters || [];

    if (baseIds.length === 0) return [];

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUuid = (value: string) => uuidRegex.test(value.trim());

    const definitionById = new Map(ratingParameterDefinitions.map((d) => [d.id, d]));
    const seen = new Set<string>();
    const uniqueSelectedIds: string[] = [];
    for (const id of baseIds) {
      if (!id || seen.has(id)) continue;
      seen.add(id);
      uniqueSelectedIds.push(id);
    }

    const resolveDefinitionLabel = (def: RatingParameterDefinitionDto): string => {
      const parameterType = String(def.parameterType || '').toUpperCase();
      const baseFieldLabel = def.formFieldId
        ? proposalFieldLabelById.get(def.formFieldId)
        : undefined;

      if (parameterType === 'FORM_FIELD') {
        const fromForm = baseFieldLabel;
        const raw = String(def.label || '').trim() || String(def.name || '').trim() || def.id;
        if (fromForm) return fromForm;
        if (!isUuid(raw)) return raw;
        return String(def.name || '').trim() || def.id;
      }

      if (parameterType === 'DERIVED') {
        const derivedType = String(def.derivedType || '').toUpperCase();
        const root =
          baseFieldLabel ||
          String(def.label || '').trim() ||
          String(def.name || '').trim() ||
          def.id;
        if (derivedType === 'COUNT') {
          return `${root} - Total Count`;
        }
        if (derivedType === 'SUM') {
          const subId = String(def.derivedSubfieldId || '').trim();
          const subLabel = subId ? proposalFieldLabelById.get(subId) || subId : '';
          return subLabel ? `${root} - Sum of ${subLabel}` : `${root} - Sum`;
        }
        return root;
      }

      const raw = String(def.label || '').trim() || String(def.name || '').trim() || def.id;
      if (!isUuid(raw)) return raw;
      const fromForm = baseFieldLabel;
      if (fromForm) return fromForm;
      return String(def.name || '').trim() || def.id;
    };

    const fromDefs = uniqueSelectedIds
      .map((id) => definitionById.get(id))
      .filter(Boolean)
      .map((def) => {
        const label = resolveDefinitionLabel(def);
        const name = String(def.name || '').trim() || label || def.id;
        return {
          id: def.id,
          definitionId: def.id,
          formFieldId: def.formFieldId || undefined,
          name,
          label,
          type: 'number',
          parameterType: def.parameterType,
          isDefinitionOnly: true,
          isActive: Boolean(def.isActive),
          derivedType: def.derivedType,
          derivedSubfieldId: def.derivedSubfieldId || undefined,
          sources: def.sources,
        } satisfies RatingParameter;
      });

    const resolvedIds = new Set(fromDefs.map((p) => p.id));
    const fromFallback = uniqueSelectedIds
      .filter((id) => !resolvedIds.has(id))
      .map((id) => allAvailableParameters.find((p) => p.id === id))
      .filter(Boolean);

    return [...fromDefs, ...fromFallback];
  }, [
    allAvailableParameters,
    defaultRatingParamsList,
    proposalFieldLabelById,
    ratingParameterDefinitions,
  ]);
  const [step2ActiveCategory, setStep2ActiveCategory] = useState<
    'base' | 'factor' | 'premiumLimit'
  >('base');

  const [step2Tab, setStep2Tab] = useState<'basePremium' | 'sumInsured' | 'premium'>('sumInsured'); // 'basePremium' commented out for now

  // Explicit step navigation state
  const [activeStep, setActiveStep] = useState<number>(1);
  // Selected parameter state
  const [selectedCEW, setSelectedCEW] = useState<CEW | null>(null);
  const [cewFormPages, setCewFormPages] = useState<CEWPage[]>([]);

  // Matrix parameters state
  const [matrixParameters, setMatrixParameters] = useState<MatrixParameter[]>([]);
  const matrixDefinitionParameters = useMemo(() => {
    const seen = new Set<string>();
    const items: MatrixParameter[] = [];
    for (const p of ratingParameters) {
      if (p.parameterType !== 'MATRIX') continue;
      const definitionId = p.definitionId || p.id;
      if (!definitionId || seen.has(definitionId)) continue;
      seen.add(definitionId);
      const resolveToFormFieldId = (source: { type: string; id: string }) => {
        if (source.type === 'FORM_FIELD') return source.id;
        const byDefinitionId = ratingParameters.find(
          (rp) => rp.definitionId === source.id || rp.id === source.id,
        );
        return byDefinitionId?.formFieldId || byDefinitionId?.id || source.id;
      };

      const fromSources =
        Array.isArray(p.sources) && p.sources.length >= 2
          ? [...p.sources]
              .sort((a, b) => a.position - b.position)
              .slice(0, 2)
              .map((s) => resolveToFormFieldId(s))
          : null;

      const fieldId1 = (fromSources?.[0] || p.formFieldId || definitionId) as string;
      const fieldId2 = (fromSources?.[1] ||
        (p as unknown as { formFieldId2?: string | null }).formFieldId2 ||
        fieldId1) as string;
      items.push({
        ratingParameterId: definitionId,
        formFieldId: fieldId1,
        formFieldId2: fieldId2,
        name: p.label || p.name || 'Matrix Parameter',
      });
    }
    return items;
  }, [ratingParameters]);
  const displayedMatrixParameters = useMemo(() => {
    const merged = [...matrixParameters];
    const existingKeys = new Set(
      matrixParameters.map(
        (item) =>
          item.ratingParameterId || `${item.formFieldId}:${item.formFieldId2}:${item.name || ''}`,
      ),
    );
    for (const def of matrixDefinitionParameters) {
      const key =
        def.ratingParameterId || `${def.formFieldId}:${def.formFieldId2}:${def.name || ''}`;
      if (!existingKeys.has(key)) {
        merged.push(def);
        existingKeys.add(key);
      }
    }
    return merged;
  }, [matrixParameters, matrixDefinitionParameters]);
  const [combinationParameters, setCombinationParameters] = useState<CombinationParameter[]>([]);
  const displayedCombinationParameters = useMemo(() => {
    const merged = [...combinationParameters];
    const existingKeys = new Set(
      combinationParameters.map(
        (item) =>
          item.ratingParameterId ||
          `${item.name}:${(item.combinationParameterIds || []).join('|')}`,
      ),
    );
    for (const def of combinationDefinitionParameters) {
      const key =
        def.ratingParameterId || `${def.name}:${(def.combinationParameterIds || []).join('|')}`;
      if (!existingKeys.has(key)) {
        merged.push(def);
        existingKeys.add(key);
      }
    }
    return merged;
  }, [combinationParameters, combinationDefinitionParameters]);
  const [isMatrixDialogOpen, setIsMatrixDialogOpen] = useState(false);
  const [matrixParameter1, setMatrixParameter1] = useState<string>('');
  const [matrixParameter2, setMatrixParameter2] = useState<string>('');
  const [matrixParameterName, setMatrixParameterName] = useState<string>('');
  const [editingMatrixParameter, setEditingMatrixParameter] = useState<MatrixParameter | null>(
    null,
  );
  const [matrixChangeAcknowledged, setMatrixChangeAcknowledged] = useState(false);
  const matrixFieldOptions = useMemo(() => {
    const byValue = new Map<string, { value: string; label: string }>();
    for (const p of proposalOriginalParameters) {
      if (isCombinationField(p.type)) continue;
      const value = String(p.id || '').trim();
      if (!value || byValue.has(value)) continue;
      const label =
        String(p.label || '').trim() ||
        String(proposalFieldLabelById.get(value) || '').trim() ||
        value;
      byValue.set(value, { value, label });
    }

    return Array.from(byValue.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [proposalFieldLabelById, proposalOriginalParameters]);
  const [isCombinationDialogOpen, setIsCombinationDialogOpen] = useState(false);
  const [combinationSearchQuery, setCombinationSearchQuery] = useState('');
  const [combinationSortOption, setCombinationSortOption] = useState<'asc' | 'desc'>('asc');
  const [combinationParameterName, setCombinationParameterName] = useState('');
  const [selectedCombinationChildIds, setSelectedCombinationChildIds] = useState<string[]>([]);
  const [editingCombinationParameter, setEditingCombinationParameter] =
    useState<CombinationParameter | null>(null);
  const [combinationChangeAcknowledged, setCombinationChangeAcknowledged] = useState(false);

  const [isReferenceParameterDialogOpen, setIsReferenceParameterDialogOpen] = useState(false);
  const [editingReferenceParameter, setEditingReferenceParameter] =
    useState<RatingParameter | null>(null);
  const [referenceFormFieldId, setReferenceFormFieldId] = useState<string>('');
  const [referenceParameterLabel, setReferenceParameterLabel] = useState<string>('');
  const [originalParamSearch, setOriginalParamSearch] = useState<string>('');
  const [derivedParamSearch, setDerivedParamSearch] = useState<string>('');
  const [paramToDelete, setParamToDelete] = useState<string | null>(null);
  const [matrixParamIndexToDelete, setMatrixParamIndexToDelete] = useState<number | null>(null);
  const [combinationParamIndexToDelete, setCombinationParamIndexToDelete] = useState<number | null>(
    null,
  );
  const referenceParamToDelete = useMemo(
    () =>
      paramToDelete
        ? referencedParameters.find(
            (param) =>
              param.id === paramToDelete ||
              param.definitionId === paramToDelete ||
              param.ratingParameterId === paramToDelete,
          ) ||
          ratingParameters.find(
            (param) =>
              param.id === paramToDelete ||
              param.definitionId === paramToDelete ||
              param.ratingParameterId === paramToDelete,
          ) ||
          null
        : null,
    [paramToDelete, referencedParameters, ratingParameters],
  );
  const matrixParamToDelete = useMemo(
    () =>
      matrixParamIndexToDelete === null
        ? null
        : displayedMatrixParameters[matrixParamIndexToDelete] || null,
    [displayedMatrixParameters, matrixParamIndexToDelete],
  );
  const combinationParamToDelete = useMemo(
    () =>
      combinationParamIndexToDelete === null
        ? null
        : displayedCombinationParameters[combinationParamIndexToDelete] || null,
    [combinationParamIndexToDelete, displayedCombinationParameters],
  );

  const lastSyncedRef = React.useRef<{
    base: string[];
    factor: string[];
    premiumLimit: string[];
  }>({
    base: [],
    factor: [],
    premiumLimit: [],
  });
  const proposalFieldIdSet = useMemo(() => {
    const ids = new Set<string>();
    for (const page of proposalTemplatePages || []) {
      for (const section of page.sections || []) {
        for (const field of section.fields || []) {
          if (field.id) ids.add(field.id);
          for (const sub of field.subFields || []) {
            if (sub.id) ids.add(sub.id);
          }
        }
      }
    }
    return ids;
  }, [proposalTemplatePages]);
  const definitionById = useMemo(() => {
    const map = new Map<string, RatingParameterDefinitionDto>();
    for (const d of ratingParameterDefinitions || []) map.set(d.id, d);
    return map;
  }, [ratingParameterDefinitions]);
  const validateSelections = (input: {
    base: string[];
    factor: string[];
    premiumLimit: string[];
  }) => {
    const invalid: {
      id: string;
      label: string;
      category: 'base' | 'factor' | 'premiumLimit';
      reason: string;
    }[] = [];
    const validateId = (id: string, category: 'base' | 'factor' | 'premiumLimit') => {
      const def = definitionById.get(id);
      if (!def) return;
      const type = String(def.parameterType || '').toUpperCase();
      if (type === 'MATRIX' || type === 'COMBINATION') return;
      const fieldId = String(def.formFieldId || '').trim();
      if (!fieldId || !proposalFieldIdSet.has(fieldId)) {
        const label = def.label || def.name || id;
        invalid.push({
          id,
          label,
          category,
          reason: fieldId
            ? 'Form field missing in proposal design'
            : 'Form field not linked to definition',
        });
      }
    };
    input.base.forEach((id) => validateId(id, 'base'));
    input.factor.forEach((id) => validateId(id, 'factor'));
    input.premiumLimit.forEach((id) => validateId(id, 'premiumLimit'));
    return { ...input, invalid };
  };
  const formatInvalidSelections = (
    invalid: Array<{
      id: string;
      label: string;
      category: 'base' | 'factor' | 'premiumLimit';
    }>,
  ) => invalid.map((i) => `${i.label} (${i.id}) [${i.category}]`).join(', ');
  const getCurrentSelections = () => {
    const baseIds =
      defaultRatingParamsList.find((p) => p.id === 'base')?.selectedRatingParameters || [];
    const factorIds =
      defaultRatingParamsList.find((p) => p.id === 'factor')?.selectedRatingParameters || [];
    const premiumLimitIds =
      defaultRatingParamsList.find((p) => p.id === 'premiumLimit')?.selectedRatingParameters || [];
    return {
      base: baseIds,
      factor: factorIds,
      premiumLimit: premiumLimitIds,
    };
  };
  const arraysEqual = (a: string[], b: string[]) => {
    if (a.length !== b.length) return false;
    const sa = new Set(a);
    for (const id of b) if (!sa.has(id)) return false;
    return true;
  };
  const eligibleCombinationChildren = useMemo(() => {
    const list = proposalOriginalParameters
      .filter((param) => !isCombinationField(param.type))
      .map((param) => ({
        id: param.id,
        ratingParameterId: param.id,
        formFieldId: param.id,
        label: param.label || param.id,
        isEligible: true,
        reason: '',
      }));

    const seen = new Set<string>();
    return list.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [proposalOriginalParameters]);

  const getFieldIdByRatingParameterId = (ratingParameterId: string) => {
    const fromEligible = eligibleCombinationChildren.find((item) => item.id === ratingParameterId);
    if (fromEligible?.formFieldId) return fromEligible.formFieldId;

    const param = ratingParameters.find(
      (p) =>
        p.id === ratingParameterId ||
        p.formFieldId === ratingParameterId ||
        (p.activeCategories || []).some((ac) => ac.ratingParameterId === ratingParameterId),
    );
    return param?.formFieldId || param?.id || ratingParameterId;
  };

  const getCombinationChildLabelById = (ratingParameterId: string) => {
    const fromEligible = eligibleCombinationChildren.find((item) => item.id === ratingParameterId);
    if (fromEligible?.label) return fromEligible.label;
    const param = allAvailableParameters.find(
      (p) =>
        p.id === ratingParameterId ||
        p.formFieldId === ratingParameterId ||
        p.definitionId === ratingParameterId ||
        (p.activeCategories || []).some((ac) => ac.ratingParameterId === ratingParameterId),
    );
    const fallback = param?.label || param?.name;
    if (fallback) return fallback;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(String(ratingParameterId || '').trim())
      ? 'Unknown Field'
      : ratingParameterId;
  };

  const getAutoCombinationName = (ids: string[]) =>
    ids.map((id) => getCombinationChildLabelById(id)).join(' x ');

  const resetMatrixDialogState = () => {
    setIsMatrixDialogOpen(false);
    setMatrixParameter1('');
    setMatrixParameter2('');
    setMatrixParameterName('');
    setEditingMatrixParameter(null);
    setMatrixChangeAcknowledged(false);
  };

  const openCreateMatrixDialog = () => {
    setEditingMatrixParameter(null);
    setMatrixParameter1('');
    setMatrixParameter2('');
    setMatrixParameterName('');
    setMatrixChangeAcknowledged(false);
    setIsMatrixDialogOpen(true);
  };

  const openEditMatrixDialog = (index: number) => {
    const target = displayedMatrixParameters[index];
    if (!target) return;
    const optionValues = new Set(matrixFieldOptions.map((o) => o.value));
    const resolveFromDefinition = (): [string, string] | null => {
      const defId = String(target.ratingParameterId || '').trim();
      if (!defId) return null;
      const defParam = ratingParameters.find(
        (p) =>
          String(p.parameterType || '').toUpperCase() === 'MATRIX' &&
          (p.definitionId === defId || p.id === defId),
      );
      if (!defParam || !Array.isArray(defParam.sources) || defParam.sources.length < 2) {
        return null;
      }
      const resolveToFormFieldId = (source: { type: string; id: string }) => {
        if (source.type === 'FORM_FIELD') return source.id;
        const byDefinitionId = ratingParameters.find(
          (rp) => rp.definitionId === source.id || rp.id === source.id,
        );
        return byDefinitionId?.formFieldId || byDefinitionId?.id || source.id;
      };
      const ids = [...defParam.sources]
        .sort((a, b) => a.position - b.position)
        .slice(0, 2)
        .map((s) => resolveToFormFieldId(s));
      const a = String(ids[0] || '').trim();
      const b = String(ids[1] || '').trim();
      if (!a || !b) return null;
      return [a, b];
    };
    const resolveMatrixSelectValue = (value: string) => {
      const raw = String(value || '').trim();
      if (!raw) return '';
      if (optionValues.has(raw)) return raw;

      const byAnyId = allAvailableParameters.find(
        (p) => p.id === raw || p.definitionId === raw || p.formFieldId === raw,
      );
      const candidate = String(byAnyId?.formFieldId || byAnyId?.id || raw);
      if (optionValues.has(candidate)) return candidate;
      return raw;
    };
    setEditingMatrixParameter(target);
    const fromDef = resolveFromDefinition();
    const raw1 = fromDef?.[0] || target.formFieldId || '';
    const raw2 = fromDef?.[1] || target.formFieldId2 || '';
    setMatrixParameter1(resolveMatrixSelectValue(raw1));
    setMatrixParameter2(resolveMatrixSelectValue(raw2));
    setMatrixParameterName(target.name || '');
    setMatrixChangeAcknowledged(false);
    setIsMatrixDialogOpen(true);
  };

  const resetCombinationDialogState = () => {
    setIsCombinationDialogOpen(false);
    setCombinationSearchQuery('');
    setCombinationSortOption('asc');
    setCombinationParameterName('');
    setSelectedCombinationChildIds([]);
    setEditingCombinationParameter(null);
    setCombinationChangeAcknowledged(false);
  };

  const openCreateCombinationDialog = () => {
    setEditingCombinationParameter(null);
    setCombinationSearchQuery('');
    setCombinationSortOption('asc');
    setCombinationParameterName('');
    setSelectedCombinationChildIds([]);
    setCombinationChangeAcknowledged(false);
    setIsCombinationDialogOpen(true);
  };

  const resolveCombinationEditChildIds = (target: CombinationParameter): string[] => {
    const eligibleIds = new Set(eligibleCombinationChildren.map((p) => p.id));
    const directIds = (target.combinationParameterIds || []).filter((id) => eligibleIds.has(id));
    if (directIds.length > 0) return directIds;

    const definitionId = String(target.ratingParameterId || '').trim();
    if (!definitionId) return [];

    const definitionParam = ratingParameters.find(
      (p) =>
        String(p.parameterType || '').toUpperCase() === 'COMBINATION' &&
        (p.definitionId === definitionId || p.id === definitionId),
    );
    if (!definitionParam || !Array.isArray(definitionParam.sources)) return [];

    const resolveToEligibleId = (source: { type: string; id: string }) => {
      if (source.type === 'FORM_FIELD') {
        return eligibleIds.has(source.id) ? source.id : null;
      }

      const byDefinitionId = ratingParameters.find(
        (rp) => rp.definitionId === source.id || rp.id === source.id,
      );
      const candidate = String(byDefinitionId?.formFieldId || byDefinitionId?.id || '').trim();
      return candidate && eligibleIds.has(candidate) ? candidate : null;
    };

    return definitionParam.sources
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((source) => resolveToEligibleId(source))
      .filter((id): id is string => Boolean(id));
  };

  const openEditCombinationDialog = (index: number) => {
    const target = displayedCombinationParameters[index];
    if (!target) return;
    setEditingCombinationParameter(target);
    setCombinationSearchQuery('');
    setCombinationSortOption('asc');
    setCombinationParameterName(target.name || '');
    setSelectedCombinationChildIds(resolveCombinationEditChildIds(target));
    setCombinationChangeAcknowledged(false);
    setIsCombinationDialogOpen(true);
  };

  const matrixChildrenChangedOnEdit = (() => {
    if (!editingMatrixParameter?.ratingParameterId) return false;
    if (!matrixParameter1 || !matrixParameter2) return false;
    const field1 = ratingParameters.find(
      (p) => p.id === matrixParameter1 || p.formFieldId === matrixParameter1,
    );
    const field2 = ratingParameters.find(
      (p) => p.id === matrixParameter2 || p.formFieldId === matrixParameter2,
    );
    if (!field1 || !field2) return false;
    const effectiveFieldId1 = field1.formFieldId || field1.id;
    const effectiveFieldId2 = field2.formFieldId || field2.id;
    const normalizeToFieldId = (raw: string) => {
      const found = ratingParameters.find((p) => p.id === raw || p.formFieldId === raw);
      return String(found?.formFieldId || found?.id || raw || '').trim();
    };
    const previousFieldId1 = normalizeToFieldId(editingMatrixParameter.formFieldId);
    const previousFieldId2 = normalizeToFieldId(editingMatrixParameter.formFieldId2);
    return previousFieldId1 !== effectiveFieldId1 || previousFieldId2 !== effectiveFieldId2;
  })();

  const combinationChildrenChangedOnEdit = (() => {
    if (!editingCombinationParameter?.ratingParameterId) return false;
    const previous = resolveCombinationEditChildIds(editingCombinationParameter)
      .map((id) => getFieldIdByRatingParameterId(id))
      .sort();
    const next = selectedCombinationChildIds.map((id) => getFieldIdByRatingParameterId(id)).sort();
    if (previous.length !== next.length) return true;
    return previous.some((id, idx) => id !== next[idx]);
  })();

  const syncIfChanged = async (options: { forceFetch?: boolean } = {}) => {
    if (!productId) {
      toast({
        title: 'Product ID missing',
        description: 'Cannot save configuration without product context.',
        variant: 'destructive',
      });
      return;
    }
    const {
      base: baseIds,
      factor: factorIds,
      premiumLimit: premiumLimitIds,
    } = getCurrentSelections();
    const last = lastSyncedRef.current;
    const changed =
      !arraysEqual(baseIds, last.base) ||
      !arraysEqual(factorIds, last.factor) ||
      !arraysEqual(premiumLimitIds, last.premiumLimit);

    if (!changed && !options.forceFetch) return;

    try {
      if (changed) {
        const validated = validateSelections({
          base: baseIds,
          factor: factorIds,
          premiumLimit: premiumLimitIds,
        });
        if (validated.invalid.length > 0) {
          toast({
            title: 'Invalid Selections',
            description: `Fix or remove: ${formatInvalidSelections(validated.invalid)}.`,
            variant: 'destructive',
          });
          return;
        }
        await saveRatingSelections(productId, validated);
        await refreshSelections();
      }

      if (changed) {
        lastSyncedRef.current = {
          base: [...baseIds],
          factor: [...factorIds],
          premiumLimit: [...premiumLimitIds],
        };
        toast({
          title: 'Configuration Saved',
          description: `Saved Base (${baseIds.length}), Factors (${factorIds.length}), Premium Limit (${premiumLimitIds.length}).`,
        });
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      toast({ title: 'Save Failed', description: message, variant: 'destructive' });
    }
  };

  // Matrix parameters handlers
  const handleSaveMatrixParameter = async () => {
    const wasEditing = Boolean(editingMatrixParameter?.ratingParameterId);
    // Validate both fields are selected
    if (!matrixParameter1 || !matrixParameter2) {
      toast({
        title: 'Validation Error',
        description: 'Please select both fields for the matrix parameter.',
        variant: 'destructive',
      });
      return;
    }

    const field1 = ratingParameters.find(
      (p) => p.id === matrixParameter1 || p.formFieldId === matrixParameter1,
    );
    const field2 = ratingParameters.find(
      (p) => p.id === matrixParameter2 || p.formFieldId === matrixParameter2,
    );
    if (!field1 || !field2) {
      toast({
        title: 'Validation Error',
        description: 'Could not resolve the selected fields. Please re-select both fields.',
        variant: 'destructive',
      });
      return;
    }

    const effectiveFieldId1 = field1.formFieldId || field1.id;
    const effectiveFieldId2 = field2.formFieldId || field2.id;

    if (
      editingMatrixParameter?.ratingParameterId &&
      matrixChildrenChangedOnEdit &&
      !matrixChangeAcknowledged
    ) {
      toast({
        title: 'Confirmation Required',
        description:
          'Please acknowledge the reset warning checkbox before saving matrix child changes.',
        variant: 'destructive',
      });
      return;
    }

    const sortedIds = [effectiveFieldId1, effectiveFieldId2].sort();
    const isDuplicate = displayedMatrixParameters.some((mp) => {
      if (editingMatrixParameter?.ratingParameterId && mp.ratingParameterId) {
        if (mp.ratingParameterId === editingMatrixParameter.ratingParameterId) {
          return false;
        }
      }
      const existingSorted = [mp.formFieldId, mp.formFieldId2].sort();
      return existingSorted[0] === sortedIds[0] && existingSorted[1] === sortedIds[1];
    });
    if (isDuplicate) {
      toast({
        title: 'Validation Error',
        description: 'This matrix already exists.',
        variant: 'destructive',
      });
      return;
    }

    const trimmedName = matrixParameterName.trim();
    const nameToSend = trimmedName.length > 0 ? trimmedName : undefined;

    try {
      if (editingMatrixParameter?.ratingParameterId) {
        await updateRatingParameterDefinition(editingMatrixParameter.ratingParameterId, {
          name: nameToSend,
          sources: [
            { type: 'FORM_FIELD', id: effectiveFieldId1 },
            { type: 'FORM_FIELD', id: effectiveFieldId2 },
          ],
        });

        setMatrixParameters((prev) =>
          prev.map((p) =>
            p.ratingParameterId === editingMatrixParameter.ratingParameterId
              ? {
                  ...p,
                  formFieldId: effectiveFieldId1,
                  formFieldId2: effectiveFieldId2,
                  name:
                    nameToSend ||
                    `${String(field1.label || field1.name || effectiveFieldId1)} : ${String(field2.label || field2.name || effectiveFieldId2)}`,
                }
              : p,
          ),
        );
      } else {
        const created = await createRatingParameterDefinition(productId, {
          parameterType: 'MATRIX',
          name: nameToSend,
          sources: [
            { type: 'FORM_FIELD', id: effectiveFieldId1 },
            { type: 'FORM_FIELD', id: effectiveFieldId2 },
          ],
        });

        const newMatrixParams = [
          ...matrixParameters,
          {
            ratingParameterId: created.id,
            formFieldId: effectiveFieldId1,
            formFieldId2: effectiveFieldId2,
            name:
              created.name ||
              nameToSend ||
              `${String(field1.label || field1.name || effectiveFieldId1)} : ${String(field2.label || field2.name || effectiveFieldId2)}`,
          },
        ];
        setMatrixParameters(newMatrixParams);
      }

      if (productId) {
        await refreshRatingParameters();
      }
      toast({
        title: wasEditing ? 'Matrix Updated' : 'Matrix Parameter Added',
        description: wasEditing
          ? 'Matrix definition updated successfully.'
          : 'Matrix definition created successfully.',
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      toast({ title: 'Save Failed', description: message, variant: 'destructive' });
      return;
    }

    resetMatrixDialogState();
  };

  const handleRemoveMatrixParameter = (index: number) => {
    setMatrixParamIndexToDelete(index);
  };

  const confirmRemoveMatrixParameter = async () => {
    if (matrixParamIndexToDelete === null) return;
    const index = matrixParamIndexToDelete;
    const target = displayedMatrixParameters[index];
    if (!target) {
      setMatrixParamIndexToDelete(null);
      return;
    }
    if (target.ratingParameterId) {
      const prev = matrixParameters;
      setMatrixParameters((current) =>
        current.filter((item) => item.ratingParameterId !== target.ratingParameterId),
      );
      try {
        await deleteRatingParameterDefinition(target.ratingParameterId);
        await refreshRatingParameters();
        await refreshSelections();
        toast({
          title: 'Matrix Definition Removed',
          description: 'Successfully removed the matrix definition.',
        });
      } catch (e: unknown) {
        setMatrixParameters(prev);
        const message = e instanceof Error ? e.message : String(e);
        toast({ title: 'Remove Failed', description: message, variant: 'destructive' });
      } finally {
        setMatrixParamIndexToDelete(null);
      }
      return;
    }

    const indexInState = matrixParameters.findIndex(
      (item) =>
        item.formFieldId === target.formFieldId &&
        item.formFieldId2 === target.formFieldId2 &&
        item.name === target.name,
    );

    const newMatrixParams =
      indexInState >= 0 ? matrixParameters.filter((_, i) => i !== indexInState) : matrixParameters;
    setMatrixParameters(newMatrixParams);
    setMatrixParamIndexToDelete(null);
  };

  const handleSaveCombinationParameter = async () => {
    const wasEditing = Boolean(editingCombinationParameter?.ratingParameterId);
    const trimmedName = combinationParameterName.trim();
    if (!trimmedName) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a name for the combination parameter.',
        variant: 'destructive',
      });
      return;
    }
    if (selectedCombinationChildIds.length < 2) {
      toast({
        title: 'Validation Error',
        description: 'Please select at least two child parameters.',
        variant: 'destructive',
      });
      return;
    }

    const isSameCombination = (a: string[], b: string[]) =>
      a.length === b.length && a.every((id, idx) => id === b[idx]);

    const alreadyExists = displayedCombinationParameters.some((item) => {
      if (editingCombinationParameter?.ratingParameterId && item.ratingParameterId) {
        if (item.ratingParameterId === editingCombinationParameter.ratingParameterId) {
          return false;
        }
      }
      return isSameCombination(item.combinationParameterIds || [], selectedCombinationChildIds);
    });
    if (alreadyExists) {
      toast({
        title: 'Validation Error',
        description: 'This combination parameter already exists.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingCombinationParameter?.ratingParameterId) {
        if (combinationChildrenChangedOnEdit && !combinationChangeAcknowledged) {
          toast({
            title: 'Confirmation Required',
            description:
              'Please acknowledge the reset warning checkbox before saving combination child changes.',
            variant: 'destructive',
          });
          return;
        }
        await updateRatingParameterDefinition(editingCombinationParameter.ratingParameterId, {
          name: trimmedName,
          sources: selectedCombinationChildIds.map((id) => ({
            type: 'FORM_FIELD' as const,
            id: getFieldIdByRatingParameterId(id),
          })),
        });

        setCombinationParameters((prev) =>
          prev.map((p) =>
            p.ratingParameterId === editingCombinationParameter.ratingParameterId
              ? {
                  ...p,
                  name: trimmedName,
                  label: trimmedName,
                  combinationParameterIds: [...selectedCombinationChildIds],
                }
              : p,
          ),
        );
      } else {
        const created = await createRatingParameterDefinition(productId, {
          parameterType: 'COMBINATION',
          name: trimmedName,
          sources: selectedCombinationChildIds.map((id) => ({
            type: 'FORM_FIELD' as const,
            id: getFieldIdByRatingParameterId(id),
          })),
        });

        setCombinationParameters([
          ...combinationParameters,
          {
            ratingParameterId: created.id,
            name: trimmedName,
            label: trimmedName,
            combinationParameterIds: [...selectedCombinationChildIds],
          },
        ]);
      }

      if (productId) {
        await refreshRatingParameters();
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      toast({ title: 'Save Failed', description: message, variant: 'destructive' });
      return;
    }

    resetCombinationDialogState();
    toast({
      title: wasEditing ? 'Combination Updated' : 'Combination Parameter Added',
      description: wasEditing
        ? 'Combination definition has been updated.'
        : 'Combination parameter has been saved.',
    });
  };

  const handleRemoveCombinationParameter = (index: number) => {
    setCombinationParamIndexToDelete(index);
  };

  const confirmRemoveCombinationParameter = async () => {
    if (combinationParamIndexToDelete === null) return;
    const index = combinationParamIndexToDelete;
    const target = displayedCombinationParameters[index];
    if (!target) {
      setCombinationParamIndexToDelete(null);
      return;
    }
    if (target.ratingParameterId) {
      try {
        await deleteRatingParameterDefinition(target.ratingParameterId);
        setRatingParameterDefinitions((prev) =>
          prev.filter(
            (d) => d.id !== target.ratingParameterId && d.definitionId !== target.ratingParameterId,
          ),
        );
        setRatingParameters((prev) =>
          prev.filter(
            (p) => p.id !== target.ratingParameterId && p.definitionId !== target.ratingParameterId,
          ),
        );
        await refreshRatingParameters();
        await refreshSelections();
        setCombinationParameters((prev) =>
          prev.filter((item) => item.ratingParameterId !== target.ratingParameterId),
        );
        toast({
          title: 'Combination Definition Removed',
          description: 'Combination definition has been deleted.',
        });
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        toast({ title: 'Remove Failed', description: message, variant: 'destructive' });
      } finally {
        setCombinationParamIndexToDelete(null);
      }
      return;
    }

    const indexInState = combinationParameters.findIndex((item) =>
      target.ratingParameterId
        ? item.ratingParameterId === target.ratingParameterId
        : item.name === target.name &&
          (item.combinationParameterIds || []).join('|') ===
            (target.combinationParameterIds || []).join('|'),
    );
    const next =
      indexInState >= 0
        ? combinationParameters.filter((_, i) => i !== indexInState)
        : [...combinationParameters];
    setCombinationParameters(next);

    if (productId) {
      try {
        const {
          base: baseIds,
          factor: factorIds,
          premiumLimit: premiumLimitIds,
        } = getCurrentSelections();
        const validated = validateSelections({
          base: baseIds,
          factor: factorIds,
          premiumLimit: premiumLimitIds,
        });
        if (validated.invalid.length > 0) {
          toast({
            title: 'Invalid Selections',
            description: `Fix or remove: ${formatInvalidSelections(validated.invalid)}.`,
            variant: 'destructive',
          });
        } else {
          await saveRatingSelections(productId, validated);
        }
        await refreshRatingParameters();
        await refreshSelections();
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        toast({ title: 'Remove Failed', description: message, variant: 'destructive' });
        setCombinationParameters(combinationParameters);
        return;
      }
    }

    toast({
      title: 'Combination Parameter Removed',
      description: 'Combination parameter has been removed.',
    });
    setCombinationParamIndexToDelete(null);
  };

  // CEW Field Configuration Dialog
  const [isCEWFieldDialogOpen, setIsCEWFieldDialogOpen] = useState(false);
  const [isProposalParametersDialogOpen, setIsProposalParametersDialogOpen] = useState(false);
  const [cewFieldConfig, setCewFieldConfig] = useState<Partial<CEWField>>({
    type: 'text',
    label: '',
    name: '',
    placeholder: '',
    required: false,
  });
  const [selectedCEWFieldId, setSelectedCEWFieldId] = useState<string | null>(null);
  const [selectedCEWSectionId, setSelectedCEWSectionId] = useState<string | null>(null);
  const [cewOptionsInput, setCewOptionsInput] = useState('');

  // Calculations
  const [sumInsuredFormula, setSumInsuredFormula] = useState<FormulaStep[]>([]);
  const [premiumFormula, setPremiumFormula] = useState<FormulaStep[]>([]);
  const [basePremiumFormula, setBasePremiumFormula] = useState<FormulaStep[]>([]);
  const [formulaCatalog, setFormulaCatalog] = useState<RatingFormulaDto[]>([]);
  const [isFormulaCatalogLoaded, setIsFormulaCatalogLoaded] = useState(false);
  const [selectedCalculation, setSelectedCalculation] = useState<'sumInsured' | 'premium' | null>(
    'sumInsured', // Initialize to match default tab
  );
  const [insertionIndex, setInsertionIndex] = useState<number | null>(null);

  // Multi-cover state
  const [isMultiCover, setIsMultiCover] = useState(false);
  const [productSections, setProductSections] = useState<
    {
      id: string;
      name: string;
      covers: { id: string; name: string }[];
    }[]
  >([]);
  const [productCovers, setProductCovers] = useState<
    {
      id: string;
      name: string;
      sectionId: string;
      sectionName: string;
      riskCategoryId?: string;
    }[]
  >([]);
  const [selectedCoverId, setSelectedCoverId] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [riskCategories, setRiskCategories] = useState<
    Awaited<ReturnType<typeof getRiskCategories>>
  >([]);
  const [selectedCoverRiskTokens, setSelectedCoverRiskTokens] = useState<
    { value: string; label: string; disabled?: boolean }[]
  >([]);
  // tracks which covers already have saved formulas (per cover, per type)
  const [coverFormulaStatus, setCoverFormulaStatus] = useState<
    Record<string, { sum: boolean; premium: boolean }>
  >({});

  // Dialog states
  const [isValueBasedDialogOpen, setIsValueBasedDialogOpen] = useState(false);
  const [isRangeBasedDialogOpen, setIsRangeBasedDialogOpen] = useState(false);
  const [isMultiSelectDialogOpen, setIsMultiSelectDialogOpen] = useState(false);
  const [isFormulaBuilderOpen, setIsFormulaBuilderOpen] = useState(false);
  const [isPlaygroundOpen, setIsPlaygroundOpen] = useState(false);
  const [playgroundType] = useState<'default' | 'proposal' | 'cew' | 'calculation' | null>(null);
  const [playgroundTestValues, setPlaygroundTestValues] = useState<Record<string, unknown>>({});
  const [playgroundResult, setPlaygroundResult] = useState<number | null>(null);

  // Form states for dialogs
  const [valueBasedForm, setValueBasedForm] = useState<Partial<ValueBasedRate>>({
    parameterId: '',
    parameterValue: '',
    rate: 0,
    rateType: 'percentage',
  });

  const [rangeBasedForm, setRangeBasedForm] = useState<Partial<RangeBasedRate>>({
    parameterId: '',
    minValue: 0,
    maxValue: 0,
    rate: 0,
    rateType: 'percentage',
  });

  const [multiSelectForm, setMultiSelectForm] = useState<Partial<MultiSelectRate>>({
    parameterIds: [],
    parameterValues: {},
    rate: 0,
    rateType: 'percentage',
  });
  const matrixNameById = useMemo(() => {
    const map = new Map<string, string>();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUuid = (value: string) => uuidRegex.test(String(value || '').trim());

    const resolveFieldLabel = (fieldId: string) => {
      const id = String(fieldId || '').trim();
      if (!id) return 'Unknown Field';
      const fromProposal = proposalFieldLabelById.get(id);
      if (fromProposal && !isUuid(fromProposal)) return fromProposal;
      const byAny = allAvailableParameters.find((p) => p.id === id || p.formFieldId === id);
      const candidate = byAny?.formFieldLabel || byAny?.label || byAny?.name || id;
      return isUuid(candidate) ? 'Unknown Field' : String(candidate);
    };

    ratingParameters
      .filter((p) => String(p.parameterType || '').toUpperCase() === 'MATRIX')
      .forEach((p) => {
        const id = p.definitionId || p.id;
        const candidate = String(p.name || p.label || '').trim();
        if (candidate && !isUuid(candidate)) {
          map.set(id, candidate);
          return;
        }
        const sources = Array.isArray(p.sources) ? [...p.sources] : [];
        if (sources.length >= 2) {
          const axis = sources
            .sort((a, b) => a.position - b.position)
            .slice(0, 2)
            .map((s) => resolveFieldLabel(s.id));
          map.set(id, `${axis[0]} : ${axis[1]}`);
          return;
        }
        map.set(id, 'Matrix');
      });
    return map;
  }, [allAvailableParameters, proposalFieldLabelById, ratingParameters]);

  // Helper to process loaded formulas
  const processFormulas = React.useCallback(
    (formulas: RatingFormulaDto[], flattenedParameters: RatingParameter[]) => {
      const sum = formulas.find((f) => f.name === 'SUM_INSURED');
      const prem = formulas.find((f) => f.name === 'PREMIUM');
      const basePrem = formulas.find((f) => f.name === 'BASE_RATE');

      if (sum?.formulaExpression) {
        const steps = sum.formulaExpression.map((t: FormulaTokenPayload & { label?: string }) => {
          const tokenLabel = t.label;
          let label: string | undefined =
            typeof tokenLabel === 'string' && tokenLabel.trim() !== '' ? tokenLabel : undefined;

          if (!label && typeof t.value === 'string' && t.value.startsWith('matrix:each:')) {
            const parts = t.value.split(':');
            if (parts.length === 4) {
              const matrixId = parts[2];
              const type = parts[3]; // PRODUCT or SUM
              const matrixName = matrixNameById.get(matrixId);
              if (matrixName) {
                const displayType = type === 'SUMPRODUCT' ? 'SUM PRODUCT' : type;
                label = `${displayType} For Each (${matrixName})`;
              }
            }
          }

          if (t.type === 'field') {
            if (!label) {
              if (typeof t.value === 'string' && t.value.startsWith('matrix:')) {
                const parts = t.value.split(':');
                if (parts.length === 2) {
                  const matrixName = matrixNameById.get(parts[1]);
                  if (matrixName) {
                    label = matrixName;
                  }
                }
              }

              const byFieldId = t.fieldId
                ? flattenedParameters.find((p) => p.id === t.fieldId)
                : undefined;
              const byRatingParameterId = t.ratingParameterId
                ? flattenedParameters.find(
                    (p) =>
                      p.id === t.ratingParameterId || p.ratingParameterId === t.ratingParameterId,
                  )
                : undefined;
              const byName = flattenedParameters.find((p) => p.name === t.value);
              const param = byFieldId || byRatingParameterId || byName;
              if (param) {
                label = param.label;
              } else if (t.value === 'sumOfSelectedCEWs') {
                label = 'Sum of Selected CEWs';
              }
            }
          } else if (t.type === 'variable') {
            if (!label) {
              if (t.value === 'sumInsured') label = 'Sum Insured';
              else if (t.value === 'baseRate') label = 'Base Rate';
            }
          } else if (t.type === 'function') {
            if (!label) {
              if (t.value === 'SUM_PRODUCT_EACH') label = 'SUM PRODUCT Each';
              else if (t.value === 'PRODUCT_EACH') label = 'PRODUCT Each';
            }
          }

          return {
            id: `step_${Date.now()}_${Math.random()}`,
            type: t.type === 'PERCENTAGE' ? 'percentage' : t.type,
            value: t.value,
            fieldId: t.fieldId,
            ratingParameterId: t.ratingParameterId,
            order: t.order,
            label,
            parameterSection: t.parameterSection,
          };
        });
        setSumInsuredFormula(steps as FormulaStep[]);
      }
      if (prem?.formulaExpression) {
        if (typeof prem.isCombinationPremium === 'boolean') {
          setIsCombinationPremiumEnabled(prem.isCombinationPremium);
        }
        if (prem.multiUnitCombinationFieldId) {
          setMultiUnitCombinationFieldId(prem.multiUnitCombinationFieldId);
        }
        const steps = prem.formulaExpression.map((t: FormulaTokenPayload & { label?: string }) => {
          const tokenLabel = t.label;
          let label: string | undefined =
            typeof tokenLabel === 'string' && tokenLabel.trim() !== '' ? tokenLabel : undefined;

          if (!label && typeof t.value === 'string' && t.value.startsWith('matrix:each:')) {
            const parts = t.value.split(':');
            if (parts.length === 4) {
              const matrixId = parts[2];
              const type = parts[3]; // PRODUCT or SUM
              const matrixName = matrixNameById.get(matrixId);
              if (matrixName) {
                const displayType = type === 'SUMPRODUCT' ? 'SUM PRODUCT' : type;
                label = `${displayType} For Each (${matrixName})`;
              }
            }
          }

          if (t.type === 'field') {
            if (!label) {
              if (typeof t.value === 'string' && t.value.startsWith('matrix:')) {
                const parts = t.value.split(':');
                if (parts.length === 2) {
                  const matrixName = matrixNameById.get(parts[1]);
                  if (matrixName) {
                    label = matrixName;
                  }
                }
              }

              const byFieldId = t.fieldId
                ? flattenedParameters.find((p) => p.id === t.fieldId)
                : undefined;
              const byRatingParameterId = t.ratingParameterId
                ? flattenedParameters.find(
                    (p) =>
                      p.id === t.ratingParameterId || p.ratingParameterId === t.ratingParameterId,
                  )
                : undefined;
              const byName = flattenedParameters.find((p) => p.name === t.value);
              const param = byFieldId || byRatingParameterId || byName;
              if (param) {
                label = param.label;
              } else if (t.value === 'sumOfSelectedCEWs') {
                label = 'Sum of Selected CEWs';
              }
            }
          } else if (t.type === 'variable') {
            if (!label) {
              if (t.value === 'sumInsured') label = 'Sum Insured';
              else if (t.value === 'baseRate') label = 'Base Rate';
            }
          } else if (t.type === 'function') {
            if (!label) {
              if (t.value === 'SUM_PRODUCT_EACH') label = 'SUM PRODUCT Each';
              else if (t.value === 'PRODUCT_EACH') label = 'PRODUCT Each';
            }
          }

          return {
            id: `step_${Date.now()}_${Math.random()}`,
            type: t.type === 'PERCENTAGE' ? 'percentage' : t.type,
            value: t.value,
            fieldId: t.fieldId,
            ratingParameterId: t.ratingParameterId,
            order: t.order,
            label,
            parameterSection: t.parameterSection,
          };
        });
        setPremiumFormula(steps as FormulaStep[]);
      }
      if (basePrem?.formulaExpression) {
        const steps = basePrem.formulaExpression.map((t: FormulaTokenPayload & { label?: string }) => {
          const tokenLabel = t.label;
          let label: string | undefined =
            typeof tokenLabel === 'string' && tokenLabel.trim() !== '' ? tokenLabel : undefined;

          if (!label && typeof t.value === 'string' && t.value.startsWith('matrix:each:')) {
            const parts = t.value.split(':');
            if (parts.length === 4) {
              const matrixId = parts[2];
              const type = parts[3];
              const matrixName = matrixNameById.get(matrixId);
              if (matrixName) {
                const displayType = type === 'SUMPRODUCT' ? 'SUM PRODUCT' : type;
                label = `${displayType} For Each (${matrixName})`;
              }
            }
          }

          if (t.type === 'field') {
            if (!label) {
              if (typeof t.value === 'string' && t.value.startsWith('matrix:')) {
                const parts = t.value.split(':');
                if (parts.length === 2) {
                  const matrixName = matrixNameById.get(parts[1]);
                  if (matrixName) {
                    label = matrixName;
                  }
                }
              }

              const byFieldId = t.fieldId
                ? flattenedParameters.find((p) => p.id === t.fieldId)
                : undefined;
              const byRatingParameterId = t.ratingParameterId
                ? flattenedParameters.find(
                    (p) =>
                      p.id === t.ratingParameterId || p.ratingParameterId === t.ratingParameterId,
                  )
                : undefined;
              const byName = flattenedParameters.find((p) => p.name === t.value);
              const param = byFieldId || byRatingParameterId || byName;
              if (param) {
                label = param.label;
              } else if (t.value === 'sumOfSelectedCEWs') {
                label = 'Sum of Selected CEWs';
              }
            }
          } else if (t.type === 'variable') {
            if (!label) {
              if (t.value === 'sumInsured') label = 'Sum Insured';
              else if (t.value === 'baseRate') label = 'Base Rate';
            }
          } else if (t.type === 'function') {
            if (!label) {
              if (t.value === 'SUM_PRODUCT_EACH') label = 'SUM PRODUCT Each';
              else if (t.value === 'PRODUCT_EACH') label = 'PRODUCT Each';
            }
          }

          return {
            id: `step_${Date.now()}_${Math.random()}`,
            type: t.type === 'PERCENTAGE' ? 'percentage' : t.type,
            value: t.value,
            fieldId: t.fieldId,
            ratingParameterId: t.ratingParameterId,
            order: t.order,
            label,
            parameterSection: t.parameterSection,
          };
        });
        setBasePremiumFormula(steps as FormulaStep[]);
      }
    },
    [matrixNameById],
  );

  const [isCombinationPremiumEnabled, setIsCombinationPremiumEnabled] = useState(false);
  const [multiUnitCombinationFieldId, setMultiUnitCombinationFieldId] = useState<
    string | undefined
  >(undefined);

  const resolveRelativeTokenRatingParameterId = React.useCallback(
    (
      token: Pick<FormulaTokenPayload, 'fieldId' | 'ratingParameterId' | 'value'>,
      flattenedParameters: RatingParameter[],
    ): string | undefined => {
      const explicit = String(token.ratingParameterId || '').trim();
      if (explicit) return explicit;

      const fieldId = String(token.fieldId || '').trim();
      const value = String(token.value || '').trim();

      const byFieldId = fieldId
        ? flattenedParameters.find(
            (p) =>
              p.id === fieldId ||
              p.formFieldId === fieldId ||
              p.definitionId === fieldId ||
              p.ratingParameterId === fieldId,
          )
        : undefined;
      const byName = value
        ? flattenedParameters.find((p) => p.name === value || p.label === value)
        : undefined;
      const matched = byFieldId || byName;

      if (matched) {
        const candidate =
          (typeof matched.ratingParameterId === 'string' && matched.ratingParameterId.trim()
            ? matched.ratingParameterId.trim()
            : undefined) ||
          (Array.isArray(matched.activeCategories)
            ? matched.activeCategories.find(
                (ac) => typeof ac.ratingParameterId === 'string' && ac.ratingParameterId.trim(),
              )?.ratingParameterId
            : undefined) ||
          (typeof matched.definitionId === 'string' && matched.definitionId.trim()
            ? matched.definitionId.trim()
            : undefined) ||
          (typeof matched.id === 'string' && matched.id.trim() ? matched.id.trim() : undefined);
        if (candidate) return candidate;
      }

      return fieldId || undefined;
    },
    [],
  );

  const handleSaveFormula = async () => {
    if (!productId) return;
    const currentFormula =
      // Base Premium logic commented out - now directly use selectedCalculation
      selectedCalculation === 'sumInsured'
        ? sumInsuredFormula
        : premiumFormula;
    if (currentFormula.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please build a formula before saving.',
        variant: 'destructive',
      });
      return;
    }

    const flattenedParameters = flattenRatingParameters(allAvailableParameters);
    const tokens = buildFormulaTokens(currentFormula).map((token) => {
      if (token.type !== 'field' || token.parameterSection !== 'RELATIVE_LOADING') {
        return token;
      }
      const ratingParameterId = resolveRelativeTokenRatingParameterId(token, flattenedParameters);
      return {
        ...token,
        ratingParameterId: ratingParameterId || token.ratingParameterId,
      };
    });
    const name =
      // Base Premium logic commented out - now directly use selectedCalculation
      selectedCalculation === 'sumInsured'
        ? 'SUM_INSURED'
        : 'PREMIUM';

    try {
      if (isMultiCover && selectedCoverId) {
        // Both PREMIUM and SUM_INSURED are per-cover for multi-cover products
        await saveRatingFormula(productId, {
          name: name as RatingFormulaDto['name'],
          formulaExpression: tokens,
          isCombinationPremium: name === 'PREMIUM' ? isCombinationPremiumEnabled : undefined,
          coverId: selectedCoverId,
          multiUnitCombinationFieldId: isCombinationPremiumEnabled
            ? multiUnitCombinationFieldId
            : undefined,
        });
        setFormulaCatalog((prev) => {
          const next = prev.filter(
            (f) => !(f.name === name && (f.coverId || null) === selectedCoverId),
          );
          next.push({
            name: name as RatingFormulaDto['name'],
            formulaExpression: tokens,
            isCombinationPremium: name === 'PREMIUM' ? isCombinationPremiumEnabled : undefined,
            coverId: selectedCoverId,
            multiUnitCombinationFieldId: isCombinationPremiumEnabled
              ? multiUnitCombinationFieldId
              : undefined,
          });
          return next;
        });

        setCoverFormulaStatus((prev) => ({
          ...prev,
          [selectedCoverId]: {
            ...(prev[selectedCoverId] ?? { sum: false, premium: false }),
            [name === 'PREMIUM' ? 'premium' : 'sum']: true,
          },
        }));

        const coverName =
          productCovers.find((c) => c.id === selectedCoverId)?.name ?? selectedCoverId;
        toast({
          title: 'Formula Saved',
          description: `${
            name === 'SUM_INSURED'
              ? 'Sum Insured'
              : 'Premium'
          } formula saved for ${coverName}.`,
        });
      } else {
        // Single-cover (global) formula
        await saveRatingFormula(productId, {
          name: name as RatingFormulaDto['name'],
          formulaExpression: tokens,
          isCombinationPremium: name === 'PREMIUM' ? isCombinationPremiumEnabled : undefined,
          multiUnitCombinationFieldId: isCombinationPremiumEnabled
            ? multiUnitCombinationFieldId
            : undefined,
        });
        setFormulaCatalog((prev) => {
          const next = prev.filter((f) => !(f.name === name && !f.coverId));
          next.push({
            name: name as RatingFormulaDto['name'],
            formulaExpression: tokens,
            isCombinationPremium: name === 'PREMIUM' ? isCombinationPremiumEnabled : undefined,
            multiUnitCombinationFieldId: isCombinationPremiumEnabled
              ? multiUnitCombinationFieldId
              : undefined,
          });
          return next;
        });

        toast({
          title: 'Formula Saved',
          description: `${
            name === 'SUM_INSURED'
              ? 'Total Sum Insured'
              : 'Premium'
          } formula saved.`,
        });
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      toast({
        title: 'Save Failed',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleRestoreFormula = async () => {
    if (!productId) return;
    try {
      const formulas = await getRatingFormulas(productId);
      const flattenedParameters = flattenRatingParameters(ratingParameters);
      processFormulas(formulas, flattenedParameters);
      toast({
        title: 'Formula Restored',
        description: 'Formula has been restored from the last saved version.',
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      toast({
        title: 'Restore Failed',
        description: message,
        variant: 'destructive',
      });
    }
  };

  // Load rating parameters from proposal form design
  useEffect(() => {
    const loadRatingParameters = async () => {
      if (!productId) {
        setIsLoadingRatingParameters(false);
        return;
      }

      try {
        setIsLoadingRatingParameters(true);
        const [parameters, definitions, product, proposalFormDesign] = await Promise.all([
          getRatingParameters(productId),
          getRatingParameterDefinitions(productId),
          getProduct(productId),
          getProposalFormDesign(productId).catch(() => null),
        ]);
        setRatingParameterDefinitions(definitions);

        if (proposalFormDesign?.pages) {
          setProposalTemplatePages(proposalFormDesign.pages);
        } else {
          setProposalTemplatePages([]);
        }

        // Detect multi-cover and load covers grouped by section
        const mode = backendProductTypeToMode(product.productType);
        if (mode === 'multi' && product.sections && product.sections.length > 0) {
          const sections = product.sections.map((s) => ({
            id: s.id!,
            name: s.name,
            covers: (s.covers ?? []).filter((c) => c.id).map((c) => ({ id: c.id!, name: c.name })),
          }));
          const allCovers = (product.sections ?? []).flatMap((s) =>
            (s.covers ?? [])
              .filter((c) => c.id)
              .map((c) => ({
                id: c.id!,
                name: c.name,
                sectionId: s.id!,
                sectionName: s.name,
                riskCategoryId: c.riskCategoryId ?? undefined,
              })),
          );
          setIsMultiCover(true);
          setProductSections(sections);
          setProductCovers(allCovers);
          if (sections.length > 0) {
            setSelectedSectionId((prev) => prev ?? sections[0].id);
          }
          if (allCovers.length > 0) {
            setSelectedCoverId((prev) => prev ?? allCovers[0].id);
          }
        }

        const sortedParameters = mergeRatingParametersWithDefinitions(
          parameters as unknown as RatingParameter[],
          definitions,
        );

        if (sortedParameters.length > 0) {
          const matrixNameByIdFromParameters = new Map<string, string>();
          sortedParameters
            .filter((p) => String(p.parameterType || '').toUpperCase() === 'MATRIX')
            .forEach((p) => {
              const id = p.definitionId || p.id;
              matrixNameByIdFromParameters.set(id, p.name || p.label || id);
            });

          setRatingParameters(sortedParameters);

          const proposalParametersForFormula: RatingParameter[] = [];
          for (const page of proposalFormDesign?.pages || []) {
            for (const section of page.sections || []) {
              for (const field of section.fields || []) {
                if (field.isRatingParameter && field.id) {
                  const isCombination = String(field.type || '').toLowerCase() === 'combination';
                  proposalParametersForFormula.push({
                    id: field.id,
                    formFieldId: field.id,
                    name: field.name || field.label,
                    label: field.label,
                    type: field.type || 'text',
                    parameterType: 'FORM_FIELD',
                    isActive: false,
                    activeCategories: [],
                    childFields: isCombination
                      ? (field.subFields || [])
                          .filter((sub: SubField) => Boolean(sub.id))
                          .map((sub: SubField) => ({
                            id: sub.id!,
                            formFieldId: sub.id!,
                            name: sub.name || sub.label,
                            label: sub.label,
                            type: sub.type || 'text',
                            parameterType: 'FORM_FIELD',
                            isActive: false,
                            activeCategories: [],
                          }))
                      : undefined,
                  });
                }
              }
            }
          }
          const flattenedParameters = flattenRatingParameters([
            ...proposalParametersForFormula,
            ...sortedParameters,
          ]);

          setIsLoadingRatingParameters(false);
          try {
            const formulas = await getRatingFormulas(productId);
            setFormulaCatalog(formulas);
            setIsFormulaCatalogLoaded(true);
            const allSections = product.sections ?? [];

            // Build per-cover formula status map: coverId → { sum, premium }
            if (mode === 'multi') {
              const statusMap: Record<string, { sum: boolean; premium: boolean }> = {};
              allSections
                .flatMap((s) => s.covers ?? [])
                .forEach((c) => {
                  if (c.id) {
                    // SUM_INSURED is global — one formula covers all covers (no coverId) OR cover-specific
                    const hasSum = formulas.some(
                      (f) => f.name === 'SUM_INSURED' && (f.coverId === c.id || !f.coverId),
                    );
                    // PREMIUM is per-cover — only a formula explicitly for this cover counts
                    const hasPrem = formulas.some(
                      (f) => f.name === 'PREMIUM' && f.coverId === c.id,
                    );
                    statusMap[c.id] = { sum: hasSum, premium: hasPrem };
                  }
                });
              setCoverFormulaStatus(statusMap);
            }

            const anyCoverId =
              mode === 'multi'
                ? (allSections.flatMap((s) => s.covers ?? []).find((c) => c.id)?.id ?? null)
                : null;

            const sum =
              mode === 'multi'
                ? formulas.find((f) => f.name === 'SUM_INSURED' && !!f.coverId)
                : formulas.find((f) => f.name === 'SUM_INSURED');
            const prem = anyCoverId
              ? formulas.find((f) => f.name === 'PREMIUM' && f.coverId === anyCoverId)
              : formulas.find((f) => f.name === 'PREMIUM');
            const baseRate = formulas.find((f) => f.name === 'BASE_RATE');
            if (sum?.formulaExpression) {
              const steps = sum.formulaExpression.map((t) => {
                const tokenLabel = (t as unknown as { label?: unknown }).label;
                let label: string | undefined =
                  typeof tokenLabel === 'string' && tokenLabel.trim() !== ''
                    ? tokenLabel
                    : undefined;

                if (!label && typeof t.value === 'string' && t.value.startsWith('matrix:each:')) {
                  const parts = t.value.split(':');
                  if (parts.length === 4) {
                    const matrixId = parts[2];
                    const type = parts[3]; // PRODUCT or SUM
                    const matrixName = matrixNameByIdFromParameters.get(matrixId);
                    if (matrixName) {
                      label = `${type} For Each (${matrixName})`;
                    }
                  }
                }

                if (t.type === 'field') {
                  if (!label) {
                    const byFieldId = t.fieldId
                      ? flattenedParameters.find((p) => p.id === t.fieldId)
                      : undefined;
                    const byRatingParameterId = t.ratingParameterId
                      ? flattenedParameters.find(
                          (p) =>
                            p.id === t.ratingParameterId ||
                            p.ratingParameterId === t.ratingParameterId,
                        )
                      : undefined;
                    const byName = flattenedParameters.find((p) => p.name === t.value);
                    const param = byFieldId || byRatingParameterId || byName;
                    if (param) {
                      label = param.label;
                    } else if (t.value === 'sumOfSelectedCEWs') {
                      label = 'Sum of Selected CEWs';
                    }
                  }
                } else if (t.type === 'variable') {
                  if (!label) {
                    if (t.value === 'sumInsured') label = 'Sum Insured';
                    else if (t.value === 'baseRate') label = 'Base Rate';
                  }
                }

                return {
                  id: `step_${Date.now()}_${Math.random()}`,
                  type: t.type === 'PERCENTAGE' ? 'percentage' : t.type,
                  value: t.value,
                  fieldId: t.fieldId,
                  ratingParameterId: t.ratingParameterId,
                  order: t.order,
                  label,
                  parameterSection: t.parameterSection,
                };
              });
              setSumInsuredFormula(steps as FormulaStep[]);
            }
            if (prem?.formulaExpression) {
              if (typeof prem.isCombinationPremium === 'boolean') {
                setIsCombinationPremiumEnabled(prem.isCombinationPremium);
              }
              const steps = prem.formulaExpression.map((t) => {
                const tokenLabel = (t as unknown as { label?: unknown }).label;
                let label: string | undefined =
                  typeof tokenLabel === 'string' && tokenLabel.trim() !== ''
                    ? tokenLabel
                    : undefined;

                if (!label && typeof t.value === 'string' && t.value.startsWith('matrix:each:')) {
                  const parts = t.value.split(':');
                  if (parts.length === 4) {
                    const matrixId = parts[2];
                    const type = parts[3]; // PRODUCT or SUM
                    const matrixName = matrixNameByIdFromParameters.get(matrixId);
                    if (matrixName) {
                      label = `${type} For Each (${matrixName})`;
                    }
                  }
                }

                if (t.type === 'field') {
                  if (!label) {
                    const byFieldId = t.fieldId
                      ? flattenedParameters.find((p) => p.id === t.fieldId)
                      : undefined;
                    const byRatingParameterId = t.ratingParameterId
                      ? flattenedParameters.find(
                          (p) =>
                            p.id === t.ratingParameterId ||
                            p.ratingParameterId === t.ratingParameterId,
                        )
                      : undefined;
                    const byName = flattenedParameters.find((p) => p.name === t.value);
                    const param = byFieldId || byRatingParameterId || byName;
                    if (param) {
                      label = param.label;
                    } else if (t.value === 'sumOfSelectedCEWs') {
                      label = 'Sum of Selected CEWs';
                    }
                  }
                } else if (t.type === 'variable') {
                  if (!label) {
                    if (t.value === 'sumInsured') label = 'Sum Insured';
                    else if (t.value === 'baseRate') label = 'Base Rate';
                  }
                }

                return {
                  id: `step_${Date.now()}_${Math.random()}`,
                  type: t.type === 'PERCENTAGE' ? 'percentage' : t.type,
                  value: t.value,
                  fieldId: t.fieldId,
                  ratingParameterId: t.ratingParameterId,
                  order: t.order,
                  label,
                  parameterSection: t.parameterSection,
                };
              });
              setPremiumFormula(steps as FormulaStep[]);
            }
            if (baseRate?.formulaExpression) {
              const steps = baseRate.formulaExpression.map((t) => {
                const tokenLabel = (t as unknown as { label?: unknown }).label;
                let label: string | undefined =
                  typeof tokenLabel === 'string' && tokenLabel.trim() !== ''
                    ? tokenLabel
                    : undefined;

                if (!label && typeof t.value === 'string' && t.value.startsWith('matrix:each:')) {
                  const parts = t.value.split(':');
                  if (parts.length === 4) {
                    const matrixId = parts[2];
                    const type = parts[3];
                    const matrixName = matrixNameByIdFromParameters.get(matrixId);
                    if (matrixName) {
                      label = `${type} For Each (${matrixName})`;
                    }
                  }
                }

                if (t.type === 'field') {
                  if (!label) {
                    const byFieldId = t.fieldId
                      ? flattenedParameters.find((p) => p.id === t.fieldId)
                      : undefined;
                    const byRatingParameterId = t.ratingParameterId
                      ? flattenedParameters.find(
                          (p) =>
                            p.id === t.ratingParameterId ||
                            p.ratingParameterId === t.ratingParameterId,
                        )
                      : undefined;
                    const byName = flattenedParameters.find((p) => p.name === t.value);
                    const param = byFieldId || byRatingParameterId || byName;
                    if (param) {
                      label = param.label;
                    } else if (t.value === 'sumOfSelectedCEWs') {
                      label = 'Sum of Selected CEWs';
                    }
                  }
                } else if (t.type === 'variable') {
                  if (!label) {
                    if (t.value === 'sumInsured') label = 'Sum Insured';
                    else if (t.value === 'baseRate') label = 'Base Rate';
                  }
                }

                return {
                  id: `step_${Date.now()}_${Math.random()}`,
                  type: t.type === 'PERCENTAGE' ? 'percentage' : t.type,
                  value: t.value,
                  fieldId: t.fieldId,
                  ratingParameterId: t.ratingParameterId,
                  order: t.order,
                  label,
                  parameterSection: t.parameterSection,
                };
              });
              setBasePremiumFormula(steps as FormulaStep[]);
            }
          } catch (error: unknown) {
            setFormulaCatalog([]);
            setIsFormulaCatalogLoaded(true);
            const message = error instanceof Error ? error.message : String(error);
            toast({ title: 'Formulas Fetch Failed', description: message, variant: 'destructive' });
          }
        } else {
          setRatingParameters([]);
          setIsLoadingRatingParameters(false);
          toast({
            title: 'No Rating Parameters Found',
            description:
              'No fields marked as rating parameters found. Please mark fields as rating parameters in the proposal form design.',
            variant: 'default',
          });
        }
      } catch (error: unknown) {
        if ((error as { status?: number }).status === 404) {
          setRatingParameters([]);
          toast({
            title: 'Proposal Form Design Not Found',
            description:
              'No proposal form design found for this product. Please create the proposal form design first.',
            variant: 'default',
          });
        } else {
          setRatingParameters([]);
          toast({
            title: 'Error Loading Rating Parameters',
            description: `Could not load rating parameters: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
            variant: 'destructive',
          });
        }
      } finally {
        setIsLoadingRatingParameters(false);
      }
    };

    loadRatingParameters();
  }, [productId, productName, productVersion, toast]);

  useEffect(() => {
    const loadRiskCategories = async () => {
      if (!productId) {
        setRiskCategories([]);
        return;
      }
      try {
        const categories = await getRiskCategories(productId);
        setRiskCategories(categories);
      } catch {
        setRiskCategories([]);
      }
    };
    loadRiskCategories();
  }, [productId]);

  useEffect(() => {
    const loadRiskTokens = () => {
      if (!productId || selectedCalculation !== 'premium') {
        setSelectedCoverRiskTokens([]);
        return;
      }

      const coverRiskCategoryId = selectedCoverId
        ? productCovers.find((c) => c.id === selectedCoverId)?.riskCategoryId
        : undefined;

      if (!coverRiskCategoryId) {
        setSelectedCoverRiskTokens([]);
        return;
      }

      const category = riskCategories.find((c) => c.id === coverRiskCategoryId);
      if (!category) {
        setSelectedCoverRiskTokens([]);
        return;
      }

      const tokens = [
        {
          value: `risk:${category.id}`,
          label: category.name,
          disabled: false,
        },
      ];

      setSelectedCoverRiskTokens(tokens);
    };

    loadRiskTokens();
  }, [productId, productCovers, riskCategories, selectedCalculation, selectedCoverId]);

  const hydrateFormulaTokens = React.useCallback(
    (tokens: FormulaTokenPayload[]): FormulaStep[] => {
      const flattenedParameters = flattenRatingParameters(ratingParameters);

      return tokens.map((t) => {
        const tokenLabel = (t as unknown as { label?: unknown }).label;
        let label: string | undefined;
        if (typeof tokenLabel === 'string') {
          const trimmed = tokenLabel.trim();
          if (trimmed && trimmed !== t.value) {
            label = trimmed;
          }
        }

        if (!label && typeof t.value === 'string' && t.value.startsWith('matrix:each:')) {
          const parts = t.value.split(':');
          if (parts.length === 4) {
            const matrixId = parts[2];
            const type = parts[3];
            const matrixName = matrixNameById.get(matrixId);
            if (matrixName) {
              const displayType = type === 'SUMPRODUCT' ? 'SUM PRODUCT' : type;
              label = `${displayType} For Each (${matrixName})`;
            }
          }
        }

        if (t.type === 'field' && !label) {
          if (typeof t.value === 'string' && t.value.startsWith('matrix:')) {
            const parts = t.value.split(':');
            if (parts.length === 2) {
              const matrixName = matrixNameById.get(parts[1]);
              if (matrixName) {
                label = matrixName;
              }
            }
          }

          const byFieldId = t.fieldId
            ? flattenedParameters.find((p) => p.id === t.fieldId)
            : undefined;
          const byRatingParameterId = t.ratingParameterId
            ? flattenedParameters.find(
                (p) => p.id === t.ratingParameterId || p.ratingParameterId === t.ratingParameterId,
              )
            : undefined;
          const byName = flattenedParameters.find((p) => p.name === t.value);
          const param = byFieldId || byRatingParameterId || byName;

          if (param) {
            label = param.label;
          } else if (t.value === 'sumOfSelectedCEWs') {
            label = 'Sum of Selected CEWs';
          }
        } else if (t.type === 'variable' && !label) {
          if (t.value === 'sumInsured') label = 'Sum Insured';
          else if (t.value === 'baseRate') label = 'Base Rate';
        } else if (t.type === 'function' && !label) {
          if (t.value === 'SUM_PRODUCT_EACH') label = 'SUM PRODUCT Each';
          else if (t.value === 'PRODUCT_EACH') label = 'PRODUCT Each';
        }

        return {
          id: `step_${Date.now()}_${Math.random()}`,
          type: t.type === 'PERCENTAGE' ? 'percentage' : (t.type as FormulaStep['type']),
          value: t.value,
          fieldId: t.fieldId,
          ratingParameterId: t.ratingParameterId,
          order: t.order,
          label,
          parameterSection: t.parameterSection,
        };
      });
    },
    [matrixNameById, ratingParameters],
  );

  // Re-load PREMIUM formula when selected cover changes (multi-cover only)
  useEffect(() => {
    if (!isMultiCover || !selectedCoverId || !productId) return;
    if (!isFormulaCatalogLoaded) return;
    const loadCoverFormula = async () => {
      try {
        const prem = formulaCatalog.find(
          (f) => f.name === 'PREMIUM' && f.coverId === selectedCoverId,
        );
        if (prem?.formulaExpression) {
          setPremiumFormula(hydrateFormulaTokens(prem.formulaExpression));
          if (prem.isCombinationPremium !== undefined) {
            setIsCombinationPremiumEnabled(!!prem.isCombinationPremium);
          }
          const nextComboId =
            typeof prem.multiUnitCombinationFieldId === 'string'
              ? prem.multiUnitCombinationFieldId
              : undefined;
          setMultiUnitCombinationFieldId(nextComboId);
        } else {
          setPremiumFormula([]);
          setMultiUnitCombinationFieldId(undefined);
        }
      } catch {
        // silently fail — user can still build the formula
      }
    };
    loadCoverFormula();
  }, [
    selectedCoverId,
    isMultiCover,
    productId,
    isFormulaCatalogLoaded,
    formulaCatalog,
    hydrateFormulaTokens,
  ]);

  // Re-load SUM_INSURED formula when selected cover changes (multi-cover only)
  useEffect(() => {
    if (!isMultiCover || !selectedCoverId || !productId) return;
    if (!isFormulaCatalogLoaded) return;
    const loadCoverFormula = async () => {
      try {
        const sum =
          formulaCatalog.find((f) => f.name === 'SUM_INSURED' && f.coverId === selectedCoverId) ??
          formulaCatalog.find((f) => f.name === 'SUM_INSURED' && !f.coverId);
        if (sum?.formulaExpression) {
          setSumInsuredFormula(hydrateFormulaTokens(sum.formulaExpression));
        } else {
          setSumInsuredFormula([]);
        }
      } catch {
        // silently fail
      }
    };
    loadCoverFormula();
  }, [
    selectedCoverId,
    isMultiCover,
    productId,
    isFormulaCatalogLoaded,
    formulaCatalog,
    hydrateFormulaTokens,
  ]);

  // Load BASE_RATE formula (global, not cover-specific)
  useEffect(() => {
    if (!productId) return;
    if (!isFormulaCatalogLoaded) return;
    const loadBaseRateFormula = async () => {
      try {
        const baseRate = formulaCatalog.find((f) => f.name === 'BASE_RATE');
        if (baseRate?.formulaExpression) {
          setBasePremiumFormula(hydrateFormulaTokens(baseRate.formulaExpression));
        } else {
          setBasePremiumFormula([]);
        }
      } catch {
        // silently fail
      }
    };
    loadBaseRateFormula();
  }, [productId, isFormulaCatalogLoaded, formulaCatalog, hydrateFormulaTokens]);

  useEffect(() => {
    const applyServerSelections = async () => {
      if (!productId) return;
      try {
        await refreshSelections();

        if (!ratingParameters || ratingParameters.length === 0) return;

        const resolveToFormFieldId = (source: { type: string; id: string }) => {
          if (source.type === 'FORM_FIELD') return source.id;
          const byDefinitionId = ratingParameters.find(
            (rp) => rp.definitionId === source.id || rp.id === source.id,
          );
          return byDefinitionId?.formFieldId || byDefinitionId?.id || source.id;
        };

        const matrixParams = Array.from(
          new Map(
            ratingParameters
              .filter((p) => String(p.parameterType || '').toUpperCase() === 'MATRIX')
              .map((p) => {
                const id = p.definitionId || p.id;
                const sourceIds =
                  Array.isArray(p.sources) && p.sources.length >= 2
                    ? [...p.sources]
                        .sort((a, b) => a.position - b.position)
                        .slice(0, 2)
                        .map((s) => resolveToFormFieldId(s))
                    : [];
                const fieldId1 = sourceIds[0] || p.formFieldId || p.id;
                const fieldId2 = sourceIds[1] || p.formFieldId || p.id;
                return [
                  id,
                  {
                    ratingParameterId: id,
                    formFieldId: fieldId1,
                    formFieldId2: fieldId2,
                    name: p.name,
                  },
                ];
              }),
          ).values(),
        );
        const loadedCombinations = Array.from(
          new Map(
            ratingParameters
              .filter((p) => String(p.parameterType || '').toUpperCase() === 'COMBINATION')
              .map((p) => {
                const ratingParameterId = p.definitionId || p.id;
                return [
                  ratingParameterId,
                  {
                    ratingParameterId,
                    name: p.label || p.name || 'Combination Parameter',
                    label: p.label || p.name || 'Combination Parameter',
                    combinationParameterIds:
                      p.sources && p.sources.length > 0
                        ? p.sources.sort((a, b) => a.position - b.position).map((s) => s.id)
                        : Array.isArray(
                              (p as unknown as { combinationParameterIds?: string[] })
                                .combinationParameterIds,
                            )
                          ? [
                              ...((p as unknown as { combinationParameterIds?: string[] })
                                .combinationParameterIds || []),
                            ]
                          : ([] as string[]),
                  },
                ];
              }),
          ).values(),
        );

        setMatrixParameters(matrixParams);
        setCombinationParameters((prev) => {
          const prevById = new Map(
            prev
              .filter((item): item is CombinationParameter & { ratingParameterId: string } =>
                Boolean(item.ratingParameterId),
              )
              .map((item) => [item.ratingParameterId, item]),
          );
          return loadedCombinations.map((item) => {
            const existing = prevById.get(item.ratingParameterId);
            return existing
              ? {
                  ...item,
                  combinationParameterIds: existing.combinationParameterIds || [],
                }
              : item;
          });
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        toast({
          title: 'Selections Hydration Failed',
          description: message,
          variant: 'destructive',
        });
      }
    };
    applyServerSelections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, ratingParameters, refreshSelections]);

  // Initialize formulaSteps to match default 'sumInsured' tab
  useEffect(() => {
    if (selectedCalculation === 'sumInsured') {
      setFormulaSteps(reindexFormula([...sumInsuredFormula]));
    } else if (selectedCalculation === 'premium') {
      setFormulaSteps(reindexFormula([...premiumFormula]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCalculation, sumInsuredFormula, premiumFormula]);

  useEffect(() => {
    if (!ratingParameters) return;
    const next: Record<string, ValueBasedRate[]> = { ...parameterValueBasedRates };
    const masters = ratingParameters?.filter((param) => param?.options?.length) || [];
    masters.forEach((param) => {
      const existing = next[param.id] || [];
      const optionValues = param.options || [];
      const rows: ValueBasedRate[] = optionValues.map((value, idx) => {
        const prev = existing[idx];
        return {
          id: prev?.id || `vb_${param.id}_${idx}`,
          parameterId: param.id,
          parameterValue: typeof value === 'string' ? value : value.value,
          rate: prev?.rate ?? 0,
          rateType: prev?.rateType ?? 'percentage',
        };
      });
      next[param.id] = rows;
    });
    setParameterValueBasedRates(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratingParameters]);

  // Initialize default sample rows for each parameter when they're loaded
  useEffect(() => {
    if (ratingParameters.length > 0 && !isLoadingRatingParameters) {
      const newValueBasedRates: Record<string, ValueBasedRate[]> = { ...parameterValueBasedRates };
      const newRangeBasedRates: Record<string, RangeBasedRate[]> = { ...parameterRangeBasedRates };

      ratingParameters.forEach((param) => {
        // Master data fields: dropdown, checkbox, multiselect, multiselectDropdown, combination, or has isMasterData flag
        const isMasterDataField =
          param.isMasterData ||
          ['dropdown', 'checkbox', 'multiselect', 'multiselectDropdown', 'combination'].includes(
            param.type,
          );

        if (isMasterDataField && !newValueBasedRates[param.id]?.length) {
          // Initialize with one sample row for master data
          const masterDataValuesForParam = masterDataValues[param.name] || [];
          // If no master data values yet, still create a row with empty value (will be populated when master data loads)
          newValueBasedRates[param.id] = [
            {
              id: `vb_${param.id}_default`,
              parameterId: param.id,
              parameterValue: masterDataValuesForParam[0] || '',
              rate: 0,
              rateType: 'percentage',
            },
          ];
        } else if (
          !isMasterDataField &&
          ['text', 'number', 'date', 'datePeriod', 'location'].includes(param.type) &&
          !newRangeBasedRates[param.id]?.length
        ) {
          // Initialize with one sample row for free input
          newRangeBasedRates[param.id] = [
            {
              id: `rb_${param.id}_default`,
              parameterId: param.id,
              minValue: 0,
              maxValue: 0,
              rate: 0,
              rateType: 'percentage',
            },
          ];
        }
      });

      // Only update if there are changes
      const hasValueBasedChanges = Object.keys(newValueBasedRates).some(
        (key) => !parameterValueBasedRates[key] || parameterValueBasedRates[key].length === 0,
      );
      const hasRangeBasedChanges = Object.keys(newRangeBasedRates).some(
        (key) => !parameterRangeBasedRates[key] || parameterRangeBasedRates[key].length === 0,
      );

      if (hasValueBasedChanges || hasRangeBasedChanges) {
        setParameterValueBasedRates(newValueBasedRates);
        setParameterRangeBasedRates(newRangeBasedRates);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratingParameters.length, isLoadingRatingParameters]);

  // Master data values (mock data - would be fetched from API)
  const getMasterDataValues = (): Record<string, string[]> => {
    if (productName === 'Directors & Officers Liability Insurance' && productVersion === '1.0') {
      return {
        industry_types: [
          'Professional Services',
          'Healthcare',
          'Technology',
          'Financial Services',
          'Real Estate / Construction',
          'Manufacturing / Trade',
          'Public Sector',
        ],
      };
    }
    // Default CAR master data
    return {
      projectType: [
        'Residential Building',
        'Commercial Building',
        'Industrial Facility',
        'Infrastructure',
        'Bridge Construction',
        'Road Construction',
        'Shopping Center',
        'Hospital/Healthcare',
        'Educational Facility',
      ],
      constructionType: ['New Construction', 'Renovation', 'Extension', 'Demolition', 'Mixed'],
      locationHazard: ['Low', 'Moderate', 'High', 'Very High'],
      subcontractorUsage: ['None', 'Limited', 'Moderate', 'Heavy'],
      safetyRecord: ['Poor', 'Average', 'Good', 'Excellent'],
      cityAreaType: ['City Center', 'Suburban', 'Industrial', 'Remote'],
      soilType: ['Sandy', 'Clay', 'Rocky', 'Mixed'],
    };
  };

  const masterDataValues = getMasterDataValues();

  const handleCreateReferenceParameter = async () => {
    if (!referenceFormFieldId || !referenceParameterLabel) {
      toast({
        title: 'Validation Error',
        description: 'Please select a base field and provide a label.',
        variant: 'destructive',
      });
      return;
    }

    if (!editingReferenceParameter) {
      const exists = definitions.some(
        (d) => d.parameterType === 'REFERENCE' && d.formFieldId === referenceFormFieldId,
      );
      if (exists) {
        toast({
          title: 'Validation Error',
          description: 'Reference already exists for this field.',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      if (editingReferenceParameter) {
        await updateRatingParameterDefinition(
          editingReferenceParameter.definitionId || editingReferenceParameter.id,
          {
            name: referenceParameterLabel.trim(),
          },
        );
        toast({
          title: 'Success',
          description: 'Reference parameter updated successfully.',
        });
      } else {
        await createRatingParameterDefinition(productId, {
          parameterType: 'REFERENCE',
          formFieldId: referenceFormFieldId,
          name: referenceParameterLabel.trim(),
        });
        toast({
          title: 'Success',
          description: 'Reference parameter created successfully.',
        });
      }

      await refreshRatingParameters();
      setIsReferenceParameterDialogOpen(false);
      setEditingReferenceParameter(null);
      setReferenceFormFieldId('');
      setReferenceParameterLabel('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteReferenceParameter = (id: string) => {
    setParamToDelete(id);
  };

  const confirmDeleteReferenceParameter = async () => {
    if (!paramToDelete) return;
    try {
      const target = ratingParameters.find((p) => p.id === paramToDelete);
      if (target?.definitionId) {
        await deleteRatingParameterDefinition(target.definitionId);
        toast({
          title: 'Deleted',
          description: 'Reference definition deleted successfully.',
        });
      } else {
        await deleteRatingParameterDefinition(paramToDelete);
        toast({
          title: 'Success',
          description: 'Reference parameter deleted successfully.',
        });
      }
      await refreshRatingParameters();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setParamToDelete(null);
    }
  };

  const openCreateDialog = () => {
    setEditingReferenceParameter(null);
    setReferenceFormFieldId('');
    setReferenceParameterLabel('');
    setIsReferenceParameterDialogOpen(true);
  };

  const openEditDialog = (param: RatingParameter) => {
    setEditingReferenceParameter(param);
    setReferenceFormFieldId(param.formFieldId || '');
    setReferenceParameterLabel(param.label || '');
    setIsReferenceParameterDialogOpen(true);
  };

  const handleBackClick = () => navigate(-1);
  const handleSaveConfigClick = () => {
    if (isSavingSelections) return;
    if (!productId) {
      toast({
        title: 'Product ID missing',
        description: 'Cannot save configuration without product context.',
        variant: 'destructive',
      });
      return;
    }
    const { base, factor, premiumLimit } = getCurrentSelections();
    setIsSavingSelections(true);
    void (async () => {
      try {
        const validated = validateSelections({ base, factor, premiumLimit });
        if (validated.invalid.length > 0) {
          toast({
            title: 'Invalid Selections',
            description: `Fix or remove: ${formatInvalidSelections(validated.invalid)}.`,
            variant: 'destructive',
          });
          return;
        }
        await saveRatingSelections(productId, validated);
        toast({
          title: 'Configuration Saved',
          description: `Saved Base (${base.length}), Factors (${factor.length}), Premium Limit (${premiumLimit.length}).`,
        });
        await refreshRatingParameters();
        await refreshSelections();
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        toast({ title: 'Save Failed', description: message, variant: 'destructive' });
      } finally {
        setIsSavingSelections(false);
      }
    })();
  };
  const onStepClick = (id: number) => () => {
    void handleStepClick(id);
  };

  const handleAddValueBasedRate = () => {
    if (
      !valueBasedForm.parameterId ||
      !valueBasedForm.parameterValue ||
      valueBasedForm.rate === undefined
    ) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    const newRate: ValueBasedRate = {
      id: `vbr_${Date.now()}`,
      parameterId: valueBasedForm.parameterId!,
      parameterValue: valueBasedForm.parameterValue,
      rate: valueBasedForm.rate!,
      rateType: valueBasedForm.rateType || 'percentage',
    };

    setValueBasedRates([...valueBasedRates, newRate]);
    setIsValueBasedDialogOpen(false);
    setValueBasedForm({
      parameterId: '',
      parameterValue: '',
      rate: 0,
      rateType: 'percentage',
    });

    toast({
      title: 'Rate Added',
      description: 'Value-based rate has been added successfully.',
    });
  };

  const handleAddRangeBasedRate = () => {
    if (
      !rangeBasedForm.parameterId ||
      rangeBasedForm.minValue === undefined ||
      rangeBasedForm.maxValue === undefined ||
      rangeBasedForm.rate === undefined
    ) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    if (rangeBasedForm.minValue! >= rangeBasedForm.maxValue!) {
      toast({
        title: 'Validation Error',
        description: 'Minimum value must be less than maximum value.',
        variant: 'destructive',
      });
      return;
    }

    const newRate: RangeBasedRate = {
      id: `rbr_${Date.now()}`,
      parameterId: rangeBasedForm.parameterId!,
      minValue: rangeBasedForm.minValue!,
      maxValue: rangeBasedForm.maxValue!,
      rate: rangeBasedForm.rate!,
      rateType: rangeBasedForm.rateType || 'percentage',
    };

    setRangeBasedRates([...rangeBasedRates, newRate]);
    setIsRangeBasedDialogOpen(false);
    setRangeBasedForm({
      parameterId: '',
      minValue: 0,
      maxValue: 0,
      rate: 0,
      rateType: 'percentage',
    });

    toast({
      title: 'Rate Added',
      description: 'Range-based rate has been added successfully.',
    });
  };

  const handleAddMultiSelectRate = () => {
    if (
      !multiSelectForm.parameterIds ||
      multiSelectForm.parameterIds.length === 0 ||
      multiSelectForm.rate === undefined
    ) {
      toast({
        title: 'Validation Error',
        description: 'Please select at least one parameter and set a rate.',
        variant: 'destructive',
      });
      return;
    }

    const newRate: MultiSelectRate = {
      id: `msr_${Date.now()}`,
      parameterIds: multiSelectForm.parameterIds!,
      parameterValues: multiSelectForm.parameterValues || {},
      rate: multiSelectForm.rate!,
      rateType: multiSelectForm.rateType || 'percentage',
    };

    setMultiSelectRates([...multiSelectRates, newRate]);
    setIsMultiSelectDialogOpen(false);
    setMultiSelectForm({
      parameterIds: [],
      parameterValues: {},
      rate: 0,
      rateType: 'percentage',
    });

    toast({
      title: 'Rate Added',
      description: 'Multi-select rate has been added successfully.',
    });
  };

  // Step-based progress tracking
  const steps = [
    {
      id: 1,
      title: 'Available Parameters',
      key: 'available',
      description: 'View original and custom rating parameters',
    },
    {
      id: 2,
      title: 'Parameter Selection',
      key: 'baseParams',
      description: 'Configure base rate and factors',
    },
    {
      id: 3,
      title: 'Calculations',
      key: 'calculations',
      description: 'Set up sum insured and premium formulas',
    },
  ];

  // Check if a step is completed
  const isStepCompleted = (stepId: number): boolean => {
    switch (stepId) {
      case 1: {
        return ratingParameters.length > 0;
      }
      case 2: {
        // Base Parameters & Factors are completed if either is configured
        const baseRateConfigured =
          defaultRatingParamsList.find((p) => p.id === 'base')?.selectedRatingParameters &&
          defaultRatingParamsList.find((p) => p.id === 'base')!.selectedRatingParameters!.length >
            0;
        const factorsConfigured =
          defaultRatingParamsList.find((p) => p.id === 'factor')?.selectedRatingParameters &&
          defaultRatingParamsList.find((p) => p.id === 'factor')!.selectedRatingParameters!.length >
            0;
        return !!(baseRateConfigured || factorsConfigured);
      }
      case 3: {
        // For multi-cover: Step is completed if ANY cover has ANY formula configured
        if (isMultiCover && productCovers.length > 0) {
          return productCovers.some((c) => {
            const status = coverFormulaStatus[c.id];
            return status?.sum || status?.premium;
          });
        }
        // For single-cover: premium formula has steps
        return premiumFormula.length > 0 || sumInsuredFormula.length > 0;
      }
      default:
        return false;
    }
  };

  // Handle step navigation
  const handleStepClick = async (stepId: number) => {
    setActiveStep(stepId);
    switch (stepId) {
      case 1: {
        setSelectedCalculation(null);
        break;
      }
      case 2: {
        setSelectedCalculation(null);
        break;
      }
      case 3: {
        // Set to sumInsured by default since Base Premium tab is commented out
        setStep2Tab('sumInsured');
        setSelectedCalculation('sumInsured');
        setFormulaSteps(reindexFormula([...sumInsuredFormula]));
        break;
      }
    }
  };

  // Navigation functions
  const handleNextStep = async () => {
    if (activeStep < steps.length) {
      const nextStep = activeStep + 1;
      await handleStepClick(nextStep);
    }
  };

  const handlePreviousStep = () => {
    if (activeStep > 1) {
      const prevStep = activeStep - 1;
      void handleStepClick(prevStep);
    }
  };

  const hasMissingReferenceInFormulaTokens = React.useCallback(
    (tokens?: FormulaTokenPayload[]) => {
      if (!tokens?.length) return false;
      return tokens.some((token) => {
        const tokenType = String(token.type || '').toLowerCase();
        if (tokenType !== 'field' && tokenType !== 'variable') return false;
        const tokenValue = String(token.value || '');
        if (tokenType === 'variable') {
          if (tokenValue === 'sumInsured' || tokenValue === 'baseRate') return false;
          if (tokenValue.startsWith('risk:')) return false;
        }
        if (tokenValue.startsWith('matrix:')) {
          const parts = tokenValue.split(':');
          if (parts.length === 2) {
            return !matrixParameters.some((item) => item.ratingParameterId === parts[1]);
          }
          if (parts.length === 3) {
            const [, fieldId1, fieldId2] = parts;
            return !matrixParameters.some(
              (item) => item.formFieldId === fieldId1 && item.formFieldId2 === fieldId2,
            );
          }
          if (parts.length === 4 && parts[1] === 'each') {
            return !matrixParameters.some((item) => item.ratingParameterId === parts[2]);
          }
          return false;
        }
        const byFieldId = token.fieldId
          ? allAvailableParameters.find((p) => p.id === token.fieldId)
          : undefined;
        if (byFieldId) return false;
        const byRatingParameterId = token.ratingParameterId
          ? allAvailableParameters.find(
              (p) =>
                p.id === token.ratingParameterId || p.ratingParameterId === token.ratingParameterId,
            )
          : undefined;
        if (byRatingParameterId) return false;
        const byName = allAvailableParameters.find((p) => p.name === tokenValue);
        return !byName;
      });
    },
    [allAvailableParameters, matrixParameters],
  );

  const coverFormulaIssuesByCoverId = useMemo(() => {
    if (!isMultiCover || !productCovers.length) return {};
    const globalSum = formulaCatalog.find((f) => f.name === 'SUM_INSURED' && !f.coverId);
    const issues: Record<string, { sum: boolean; premium: boolean }> = {};
    productCovers.forEach((cover) => {
      const coverSum = formulaCatalog.find(
        (f) => f.name === 'SUM_INSURED' && f.coverId === cover.id,
      );
      const coverPremium = formulaCatalog.find(
        (f) => f.name === 'PREMIUM' && f.coverId === cover.id,
      );
      issues[cover.id] = {
        sum: hasMissingReferenceInFormulaTokens(
          (coverSum || globalSum)?.formulaExpression as FormulaTokenPayload[] | undefined,
        ),
        premium: hasMissingReferenceInFormulaTokens(
          coverPremium?.formulaExpression as FormulaTokenPayload[] | undefined,
        ),
      };
    });
    return issues;
  }, [isMultiCover, productCovers, formulaCatalog, hasMissingReferenceInFormulaTokens]);

  const sumInsuredTabHasMissing = useMemo(() => {
    if (isMultiCover) {
      if (!selectedCoverId) return false;
      return coverFormulaIssuesByCoverId[selectedCoverId]?.sum || false;
    }
    const sum = formulaCatalog.find((f) => f.name === 'SUM_INSURED' && !f.coverId);
    return hasMissingReferenceInFormulaTokens(
      sum?.formulaExpression as FormulaTokenPayload[] | undefined,
    );
  }, [
    isMultiCover,
    selectedCoverId,
    coverFormulaIssuesByCoverId,
    formulaCatalog,
    hasMissingReferenceInFormulaTokens,
  ]);

  const premiumTabHasMissing = useMemo(() => {
    if (isMultiCover) {
      if (!selectedCoverId) return false;
      return coverFormulaIssuesByCoverId[selectedCoverId]?.premium || false;
    }
    const prem = formulaCatalog.find((f) => f.name === 'PREMIUM' && !f.coverId);
    return hasMissingReferenceInFormulaTokens(
      prem?.formulaExpression as FormulaTokenPayload[] | undefined,
    );
  }, [
    isMultiCover,
    selectedCoverId,
    coverFormulaIssuesByCoverId,
    formulaCatalog,
    hasMissingReferenceInFormulaTokens,
  ]);

  return (
    <div className="flex flex-col h-screen bg-background">
      <RatingConfiguratorHeader
        productName={productName}
        productVersion={productVersion}
        onBack={handleBackClick}
        onPreviewProposalParameters={() => setIsProposalParametersDialogOpen(true)}
        onSaveConfiguration={handleSaveConfigClick}
      />

      <StepProgress
        steps={steps}
        activeStep={activeStep}
        isStepCompleted={isStepCompleted}
        onStepClick={(stepId) => onStepClick(stepId)()}
      />

      {/* Main Content */}
      <div
        className="flex-1 overflow-auto p-4 pb-24"
        style={{
          backgroundImage: `radial-gradient(circle, #e5e7eb 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }}
      >
        {/* Step 2: Proposal Parameters - List-based Layout with Classifications */}

        <div className="w-full px-4 space-y-6">
          {/* Step 1: Available Parameters */}
          {activeStep === 1 && (
            <Card className="flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-2xl font-semibold">Available Parameters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-6">
                  <div className="rounded-xl border bg-background">
                    <div className="border-b p-3 flex items-center gap-2">
                      <h3 className="text-sm font-semibold">Original Parameters</h3>
                      <Badge variant="outline" className="text-[10px] whitespace-nowrap">
                        {proposalOriginalParameters.length}
                      </Badge>
                      <div className="ml-auto w-full max-w-xs">
                        <Input
                          value={originalParamSearch}
                          onChange={(e) => setOriginalParamSearch(e.target.value)}
                          placeholder="Search..."
                          className="h-8"
                        />
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="rounded-md">
                        <div className="flex flex-wrap gap-2">
                          {proposalOriginalParameters
                            .filter((param) => {
                              const q = originalParamSearch.trim().toLowerCase();
                              if (!q) return true;
                              return (
                                param.label.toLowerCase().includes(q) ||
                                (param.type || '').toLowerCase().includes(q)
                              );
                            })
                            .map((param) => (
                              <Badge
                                key={param.id}
                                variant="secondary"
                                className="px-2 py-1 text-[11px] gap-1.5"
                              >
                                <span className="max-w-[260px] truncate">{param.label}</span>
                                <span className="text-[10px] uppercase text-muted-foreground">
                                  {param.type}
                                </span>
                              </Badge>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border bg-background">
                    <div className="border-b p-3 flex items-center gap-2">
                      <h3 className="text-sm font-semibold">
                        Combination Based Derived Parameters
                      </h3>
                      <Badge variant="outline" className="text-[10px] whitespace-nowrap">
                        {derivedDefinitionParameters.length}
                      </Badge>
                      <div className="ml-auto w-full max-w-xs">
                        <Input
                          value={derivedParamSearch}
                          onChange={(e) => setDerivedParamSearch(e.target.value)}
                          placeholder="Search..."
                          className="h-8"
                        />
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="rounded-md">
                        <div className="flex flex-wrap gap-2">
                          {derivedDefinitionParameters
                            .filter((param) => {
                              const q = derivedParamSearch.trim().toLowerCase();
                              if (!q) return true;
                              return (
                                param.label.toLowerCase().includes(q) ||
                                (param.type || '').toLowerCase().includes(q)
                              );
                            })
                            .map((param) => (
                              <Badge
                                key={param.id}
                                variant="secondary"
                                className="px-2 py-1 text-[11px] gap-1.5"
                              >
                                <span className="max-w-[260px] truncate">{param.label}</span>
                                <span className="text-[10px] uppercase text-muted-foreground">
                                  {param.type}
                                </span>
                              </Badge>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="rounded-xl border bg-background p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold">Referenced Parameters</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {referencedParameters.length} Total
                          </Badge>
                          <Button size="sm" variant="outline" onClick={openCreateDialog}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Reference
                          </Button>
                        </div>
                      </div>
                      {referencedParameters.length === 0 ? (
                        <div className="text-sm text-muted-foreground italic">
                          No referenced parameters available.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pr-1">
                          {referencedParameters.map((param) => (
                            <div
                              key={
                                param.definitionId ||
                                `${param.formFieldId}:${param.label}` ||
                                param.id
                              }
                              className="flex items-center justify-between p-3 border rounded-lg bg-background hover:bg-muted/30 hover:border-primary/40 transition"
                            >
                              <div className="space-y-1 min-w-0">
                                <span className="font-medium text-sm block truncate">
                                  {param.label}
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  Base: {param.formFieldLabel || param.name || 'Unknown'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="hover:bg-primary/10"
                                  onClick={() => openEditDialog(param)}
                                  aria-label="Edit reference parameter"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                                  onClick={() => handleDeleteReferenceParameter(param.id)}
                                  aria-label="Delete reference parameter"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="rounded-xl border bg-background p-4">
                      <MatrixParametersPanel
                        ratingParameters={allAvailableParameters}
                        matrixParameters={displayedMatrixParameters}
                        onAddMatrix={openCreateMatrixDialog}
                        onEditMatrix={openEditMatrixDialog}
                        onRemoveMatrix={handleRemoveMatrixParameter}
                      />
                    </div>

                    <div className="rounded-xl border bg-background p-4">
                      <CombinationParametersPanel
                        ratingParameters={allAvailableParameters}
                        combinationParameters={displayedCombinationParameters}
                        onAddCombination={openCreateCombinationDialog}
                        onEditCombination={openEditCombinationDialog}
                        onRemoveCombination={handleRemoveCombinationParameter}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Base Parameters & Factors */}
          {activeStep === 2 && (
            <Card className="h-[calc(100vh-190px)] flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-2xl font-semibold">
                    Base / Factor / Premium Limit
                  </CardTitle>
                  <Button size="sm" onClick={handleSaveConfigClick} disabled={isSavingSelections}>
                    {isSavingSelections ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {isSavingSelections ? 'Saving...' : 'Save Selections'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 flex flex-col gap-4">
                <div className="flex-1 min-h-0">
                  <RatingParameterTreeLayout
                    activeCategory={step2ActiveCategory}
                    onActiveCategoryChange={setStep2ActiveCategory}
                    defaultRatingParamsList={defaultRatingParamsList}
                    definitions={ratingParameterDefinitions}
                    proposalPages={proposalTemplatePages}
                    onChangeDefaultRatingParamsList={setDefaultRatingParamsList}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Cover Selector (multi-cover only) — appears ABOVE calculation tabs */}
          {activeStep === 3 &&
            isMultiCover &&
            productCovers.length > 0 &&
            (() => {
              const totalDone = productCovers.filter(
                (c) => coverFormulaStatus[c.id]?.premium,
              ).length;
              const globalSumDone = productCovers.some((c) => coverFormulaStatus[c.id]?.sum);
              const allDoneGlobal = globalSumDone && totalDone === productCovers.length;
              const activeSectionCovers =
                productSections.find((s) => s.id === selectedSectionId)?.covers ?? [];

              return (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Select Cover</CardTitle>
                      {allDoneGlobal && (
                        <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> All configured
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Two-panel layout */}
                    <div
                      className="flex rounded-lg border border-border overflow-hidden"
                      style={{ minHeight: '160px' }}
                    >
                      {/* LEFT PANEL — Sections */}
                      <div className="w-44 flex-shrink-0 border-r border-border bg-muted/30 overflow-y-auto">
                        <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                          Sections
                        </p>
                        {productSections.map((section) => {
                          const total = section.covers.length;
                          const isActiveSection = selectedSectionId === section.id;
                          const doneInSection = section.covers.filter(
                            (c) => coverFormulaStatus[c.id]?.premium,
                          ).length;
                          return (
                            <button
                              key={section.id}
                              type="button"
                              onClick={() => {
                                setSelectedSectionId(section.id);
                                const first =
                                  section.covers.find((c) => !coverFormulaStatus[c.id]?.premium) ??
                                  section.covers[0];
                                if (first) setSelectedCoverId(first.id);
                              }}
                              className={[
                                'w-full flex items-center justify-between px-3 py-2.5 text-left text-sm transition-colors',
                                isActiveSection
                                  ? 'bg-background border-r-2 border-r-primary text-foreground font-medium'
                                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                              ].join(' ')}
                            >
                              <span className="truncate text-xs">{section.name}</span>
                              <span className="flex-shrink-0 text-[10px] text-muted-foreground ml-1">
                                {doneInSection}/{total}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* RIGHT PANEL — Covers of selected section */}
                      <div className="flex-1 overflow-y-auto">
                        {activeSectionCovers.length === 0 ? (
                          <div className="flex items-center justify-center h-full text-xs text-muted-foreground p-4">
                            No covers in this section
                          </div>
                        ) : (
                          <>
                            <p className="px-4 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                              Covers — click to configure
                            </p>
                            {activeSectionCovers.map((cover) => {
                              const status = coverFormulaStatus[cover.id];
                              const isComplete = status?.premium;
                              const isActive = selectedCoverId === cover.id;
                              const hasFormulaIssue =
                                coverFormulaIssuesByCoverId[cover.id]?.sum ||
                                coverFormulaIssuesByCoverId[cover.id]?.premium;
                              return (
                                <button
                                  key={cover.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedCoverId(cover.id);
                                  }}
                                  className={[
                                    'w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors border-b border-border/50 last:border-b-0',
                                    isActive
                                      ? 'bg-primary/5 text-primary'
                                      : 'hover:bg-muted/40 text-foreground',
                                  ].join(' ')}
                                >
                                  <span
                                    className={[
                                      'flex-1 truncate font-medium',
                                      isActive ? 'text-primary' : '',
                                    ].join(' ')}
                                  >
                                    {cover.name}
                                  </span>

                                  {/* Right badges */}
                                  {isActive && !isComplete && (
                                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium flex-shrink-0">
                                      Editing
                                    </span>
                                  )}
                                  {isComplete && (
                                    <span className="flex items-center gap-0.5 text-[10px] bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400 px-1.5 py-0.5 rounded font-medium flex-shrink-0">
                                      <CheckCircle2 className="w-2.5 h-2.5" /> Done
                                    </span>
                                  )}
                                  {hasFormulaIssue ? (
                                    <span className="flex items-center gap-0.5 text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium flex-shrink-0">
                                      <AlertTriangle className="w-2.5 h-2.5" /> Issue
                                    </span>
                                  ) : null}
                                </button>
                              );
                            })}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Footer breadcrumb */}
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground">
                        {selectedCoverId
                          ? (() => {
                              const cover = productCovers.find((c) => c.id === selectedCoverId);
                              return cover ? (
                                <>
                                  Viewing:{' '}
                                  <span className="font-medium text-foreground">
                                    {cover.sectionName} › {cover.name}
                                  </span>
                                </>
                              ) : (
                                'Select a cover above'
                              );
                            })()
                          : 'Select a cover above'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

          {/* Step 3: Calculations */}
          {activeStep === 3 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-2xl font-semibold">Calculations</CardTitle>
              </CardHeader>
              <CardContent>
                <CalculationTabs
                  value={step2Tab === 'basePremium' ? 'sumInsured' : step2Tab}
                  onValueChange={(value) => {
                    if (isMultiCover && value === 'premium' && !selectedCoverId) {
                      toast({
                        title: 'Select a cover first',
                        description:
                          'Choose a cover from the panel above before configuring its Premium formula.',
                      });
                      return;
                    }
                    setStep2Tab(value);
                    // Base Premium case removed since tab is commented out
                    if (value === 'sumInsured') {
                      setSelectedCalculation('sumInsured');
                      setFormulaSteps(reindexFormula([...sumInsuredFormula]));
                    } else {
                      setSelectedCalculation('premium');
                      setFormulaSteps(reindexFormula([...premiumFormula]));
                    }
                  }}
                  // basePremiumHasFormula={basePremiumFormula.length > 0} - Commented out for now
                  sumInsuredHasFormula={
                    isMultiCover && productCovers.length > 0
                      ? productCovers.every((c) => coverFormulaStatus[c.id]?.sum === true)
                      : sumInsuredFormula.length > 0
                  }
                  premiumHasFormula={
                    isMultiCover && productCovers.length > 0
                      ? productCovers.every((c) => coverFormulaStatus[c.id]?.premium === true)
                      : premiumFormula.length > 0
                  }
                  // basePremiumHasMissing={false} - Commented out for now
                  sumInsuredHasMissing={sumInsuredTabHasMissing}
                  premiumHasMissing={premiumTabHasMissing}
                />
              </CardContent>
            </Card>
          )}

          {/* Calculation Configuration - Show when in Step 3 */}
          {activeStep === 3 && selectedCalculation && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  {selectedCalculation === 'sumInsured'
                    ? 'Sum Insured Calculation'
                    : step2Tab === 'basePremium'
                      ? 'Base Premium Calculation'
                      : 'Premium Calculation'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isMultiCover && selectedCalculation === 'premium' && !selectedCoverId ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    Select a cover above to configure its Premium formula.
                  </p>
                ) : (
                  <InlineFormulaBuilder
                    selectedCalculation={selectedCalculation}
                    ratingParameters={ratingParameters}
                    allAvailableParameters={allAvailableParameters}
                    selectedRelativeParameters={
                      step2Tab === 'basePremium'
                        ? selectedBasePremiumParameters
                        : selectedRelativeParameters
                    }
                    matrixParameters={matrixParameters}
                    riskCategoryTokens={
                      selectedCalculation === 'premium' ? selectedCoverRiskTokens : []
                    }
                    hasCombinationPremium={
                      selectedCalculation === 'premium' ? hasCombinationPremium : false
                    }
                    isCombinationPremiumEnabled={isCombinationPremiumEnabled}
                    onChangeCombinationPremiumEnabled={setIsCombinationPremiumEnabled}
                    multiUnitCombinationFieldId={multiUnitCombinationFieldId}
                    onChangeMultiUnitCombinationFieldId={setMultiUnitCombinationFieldId}
                    multiUnitCombinationFieldOptions={multiUnitCombinationFieldOptions}
                    formula={
                      // Base Premium logic commented out - now directly use selectedCalculation
                      selectedCalculation === 'sumInsured'
                        ? sumInsuredFormula
                        : premiumFormula
                    }
                    onChangeFormula={(next) => {
                      setFormulaSteps(next);
                      // Base Premium logic commented out - now directly use selectedCalculation
                      if (selectedCalculation === 'sumInsured') {
                        setSumInsuredFormula(next);
                      } else {
                        setPremiumFormula(next);
                      }
                    }}
                    insertionIndex={insertionIndex}
                    setInsertionIndex={setInsertionIndex}
                    toast={toast}
                    onSave={handleSaveFormula}
                    onRestore={handleRestoreFormula}
                  />
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-8 py-3">
        <StepNavigationButtons
          onPrevious={handlePreviousStep}
          onNext={handleNextStep}
          disablePrevious={activeStep <= 1}
          disableNext={
            activeStep === 1
              ? !isStepCompleted(1)
              : activeStep === 2
                ? !isStepCompleted(2)
                : activeStep === steps.length
          }
          showNext={activeStep !== 3}
        />
      </div>

      {/* Proposal Parameters Dialog */}
      <Dialog
        open={isProposalParametersDialogOpen}
        onOpenChange={setIsProposalParametersDialogOpen}
      >
        <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Proposal Parameters</DialogTitle>
            <DialogDescription>
              This is a preview of the settings shown to the Underwriters inside their product
              configuration
            </DialogDescription>
          </DialogHeader>
          <div className="w-full px-1 space-y-4">
            <Card>
              <CardContent className="pt-4">
                {isLoadingRatingParameters ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Loading rating parameters from proposal form...
                  </div>
                ) : !ratingParameters || !ratingParameters?.length ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No rating parameters found. Mark fields as rating parameters in the proposal
                    form design.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Master Data Parameters Section */}
                    {ratingParameters.filter((param) => param?.options?.length || 0).length > 0 && (
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-base font-semibold mb-0.5">Master Data Parameters</h3>
                          <p className="text-xs text-muted-foreground">
                            Value-based pricing design
                          </p>
                        </div>
                        {ratingParameters
                          .filter((param) => param.options && param.options.length > 0)
                          .map((param) => {
                            const paramValueBasedRates = parameterValueBasedRates[param.id] || [];

                            return (
                              <Card key={param.id} className="border">
                                <CardHeader className="pb-2">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <CardTitle className="text-sm font-semibold">
                                        {param.label}
                                      </CardTitle>
                                      <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                                        {param.type}
                                      </p>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="pt-3">
                                  <div className="space-y-2">
                                    {/* Header Row */}
                                    <div className="grid grid-cols-4 gap-3 p-1.5 bg-muted/50 rounded text-xs font-semibold">
                                      <div>Value</div>
                                      <div>Pricing Type</div>
                                      <div>Loading/Discount</div>
                                      <div>Quote Options</div>
                                    </div>
                                    {/* Data Rows */}
                                    {paramValueBasedRates.length === 0 ? (
                                      <div className="text-center py-3 text-xs text-muted-foreground">
                                        No rows added. Click "Add Row" to configure pricing.
                                      </div>
                                    ) : (
                                      paramValueBasedRates.map((rate) => (
                                        <div
                                          key={rate.id}
                                          className="grid grid-cols-4 gap-3 items-center px-1.5"
                                        >
                                          <div className="text-xs text-muted-foreground">
                                            {rate.parameterValue || 'Select value'}
                                          </div>
                                          <Select
                                            value={
                                              rate.rateType === 'percentage'
                                                ? 'Percentage'
                                                : 'Fixed Amount'
                                            }
                                            disabled
                                          >
                                            <SelectTrigger className="h-8 text-xs">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="Percentage">Percentage</SelectItem>
                                              <SelectItem value="Fixed Amount">
                                                Fixed Amount
                                              </SelectItem>
                                            </SelectContent>
                                          </Select>
                                          <Input
                                            type="number"
                                            value={rate.rate}
                                            disabled
                                            placeholder="0.00"
                                            className="h-8 text-xs"
                                          />
                                          <div className="flex items-center gap-1.5">
                                            <Select defaultValue="Auto Quote" disabled>
                                              <SelectTrigger className="h-8 text-xs">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="Auto Quote">
                                                  Auto Quote
                                                </SelectItem>
                                                <SelectItem value="Refer to UW">
                                                  Refer to UW
                                                </SelectItem>
                                                <SelectItem value="No Quote">No Quote</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                      </div>
                    )}

                    {/* Free Input Parameters Section */}
                    {(ratingParameters.filter((param) => !param.options?.length)?.length || 0) >
                      0 && (
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-base font-semibold mb-0.5">Free Input Parameters</h3>
                          <p className="text-xs text-muted-foreground">
                            Range-based pricing design
                          </p>
                        </div>
                        {ratingParameters
                          .filter((param) => !param.options?.length)
                          .map((param) => {
                            const paramRangeBasedRates = parameterRangeBasedRates[param.id] || [];

                            return (
                              <Card key={param.id} className="border">
                                <CardHeader className="pb-2">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <CardTitle className="text-sm font-semibold">
                                        {param.label}
                                      </CardTitle>
                                      <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                                        {param.type}
                                      </p>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="pt-3">
                                  <div className="space-y-2">
                                    {/* Header Row */}
                                    <div className="grid grid-cols-5 gap-3 p-1.5 bg-muted/50 rounded text-xs font-semibold">
                                      <div>From</div>
                                      <div>To</div>
                                      <div>Pricing Type</div>
                                      <div>Loading/Discount</div>
                                      <div>Quote Option</div>
                                    </div>
                                    {/* Data Rows */}
                                    {paramRangeBasedRates.length === 0 ? (
                                      <div className="text-center py-3 text-xs text-muted-foreground">
                                        No rows added. Click "Add Row" to configure pricing.
                                      </div>
                                    ) : (
                                      paramRangeBasedRates.map((rate) => (
                                        <div
                                          key={rate.id}
                                          className="grid grid-cols-5 gap-3 items-center"
                                        >
                                          <Input
                                            type="number"
                                            value={rate.minValue}
                                            disabled
                                            placeholder="0"
                                            className="h-8 text-xs"
                                          />
                                          <Input
                                            type="number"
                                            value={rate.maxValue}
                                            disabled
                                            placeholder="0"
                                            className="h-8 text-xs"
                                          />
                                          <Select
                                            value={
                                              rate.rateType === 'percentage'
                                                ? 'Percentage'
                                                : 'Fixed Amount'
                                            }
                                            disabled
                                          >
                                            <SelectTrigger className="h-8 text-xs">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="Percentage">Percentage</SelectItem>
                                              <SelectItem value="Fixed Amount">
                                                Fixed Amount
                                              </SelectItem>
                                            </SelectContent>
                                          </Select>
                                          <Input
                                            type="number"
                                            value={rate.rate}
                                            disabled
                                            placeholder="0.00"
                                            className="h-8 text-xs"
                                          />
                                          <div className="flex items-center gap-1.5">
                                            <Select defaultValue="Auto Quote" disabled>
                                              <SelectTrigger className="h-8 text-xs">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="Auto Quote">
                                                  Auto Quote
                                                </SelectItem>
                                                <SelectItem value="Refer to UW">
                                                  Refer to UW
                                                </SelectItem>
                                                <SelectItem value="No Quote">No Quote</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}
                {/* Navigation Buttons */}
                {/* <div className="flex items-center justify-end pt-4 mt-4 border-t">
                  <Button onClick={() => setIsProposalParametersDialogOpen(false)}>Close</Button>
                </div> */}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Value-Based Rate Dialog */}
      <Dialog open={isValueBasedDialogOpen} onOpenChange={setIsValueBasedDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Value-Based Rate</DialogTitle>
            <DialogDescription>Define a rate based on a specific parameter value</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Parameter *</Label>
              <Select
                value={valueBasedForm.parameterId}
                onValueChange={(value) => {
                  setValueBasedForm({ ...valueBasedForm, parameterId: value, parameterValue: '' });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parameter" />
                </SelectTrigger>
                <SelectContent>
                  {ratingParameters.map((param) => (
                    <SelectItem key={param.id} value={param.id}>
                      {param.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {valueBasedForm.parameterId &&
              (() => {
                const param = ratingParameters.find((p) => p.id === valueBasedForm.parameterId);
                if (param?.type === 'checkbox') {
                  return (
                    <div className="space-y-2">
                      <Label>Value *</Label>
                      <Select
                        value={valueBasedForm.parameterValue}
                        onValueChange={(value) =>
                          setValueBasedForm({ ...valueBasedForm, parameterValue: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select value" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  );
                }
                if (param?.options && param.options.length > 0) {
                  return (
                    <div className="space-y-2">
                      <Label>Value *</Label>
                      <Select
                        value={valueBasedForm.parameterValue}
                        onValueChange={(value) =>
                          setValueBasedForm({ ...valueBasedForm, parameterValue: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select value" />
                        </SelectTrigger>
                        <SelectContent>
                          {param.options.map((option) => (
                            <SelectItem
                              key={typeof option === 'string' ? option : option.value}
                              value={typeof option === 'string' ? option : option.value}
                            >
                              {typeof option === 'string' ? option : option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                }
                return (
                  <div className="space-y-2">
                    <Label>Value *</Label>
                    <Input
                      value={valueBasedForm.parameterValue}
                      onChange={(e) =>
                        setValueBasedForm({ ...valueBasedForm, parameterValue: e.target.value })
                      }
                      placeholder="Enter value"
                    />
                  </div>
                );
              })()}
            <div className="space-y-2">
              <Label>Rate *</Label>
              <Input
                type="number"
                step="0.01"
                value={valueBasedForm.rate}
                onChange={(e) =>
                  setValueBasedForm({ ...valueBasedForm, rate: parseFloat(e.target.value) || 0 })
                }
                placeholder="Enter rate"
              />
            </div>
            <div className="space-y-2">
              <Label>Rate Type *</Label>
              <Select
                value={valueBasedForm.rateType}
                onValueChange={(value: 'percentage' | 'fixed') =>
                  setValueBasedForm({ ...valueBasedForm, rateType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount (AED)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsValueBasedDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddValueBasedRate}>Add Rate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Range-Based Rate Dialog */}
      <Dialog open={isRangeBasedDialogOpen} onOpenChange={setIsRangeBasedDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Range-Based Rate</DialogTitle>
            <DialogDescription>Define a rate based on a parameter range</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Parameter *</Label>
              <Select
                value={rangeBasedForm.parameterId}
                onValueChange={(value) =>
                  setRangeBasedForm({ ...rangeBasedForm, parameterId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parameter" />
                </SelectTrigger>
                <SelectContent>
                  {ratingParameters
                    .filter((p) => p.type === 'number')
                    .map((param) => (
                      <SelectItem key={param.id} value={param.id}>
                        {param.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 pb-6">
                <Label>Min Value *</Label>
                <Input
                  type="number"
                  value={rangeBasedForm.minValue}
                  onChange={(e) =>
                    setRangeBasedForm({
                      ...rangeBasedForm,
                      minValue: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="Min"
                />
              </div>
              <div className="space-y-2">
                <Label>Max Value *</Label>
                <Input
                  type="number"
                  value={rangeBasedForm.maxValue}
                  onChange={(e) =>
                    setRangeBasedForm({
                      ...rangeBasedForm,
                      maxValue: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="Max"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Rate *</Label>
              <Input
                type="number"
                step="0.01"
                value={rangeBasedForm.rate}
                onChange={(e) =>
                  setRangeBasedForm({ ...rangeBasedForm, rate: parseFloat(e.target.value) || 0 })
                }
                placeholder="Enter rate"
              />
            </div>
            <div className="space-y-2">
              <Label>Rate Type *</Label>
              <Select
                value={rangeBasedForm.rateType}
                onValueChange={(value: 'percentage' | 'fixed') =>
                  setRangeBasedForm({ ...rangeBasedForm, rateType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount (AED)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRangeBasedDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRangeBasedRate}>Add Rate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Multi-Select Rate Dialog */}
      <Dialog open={isMultiSelectDialogOpen} onOpenChange={setIsMultiSelectDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Multi-Select Rate</DialogTitle>
            <DialogDescription>Combine multiple parameters for aggregated rates</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Parameters *</Label>
              <div className="space-y-2">
                {ratingParameters.map((param) => (
                  <div key={param.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`param-${param.id}`}
                      checked={multiSelectForm.parameterIds?.includes(param.id) || false}
                      onChange={(e) => {
                        const currentIds = multiSelectForm.parameterIds || [];
                        if (e.target.checked) {
                          setMultiSelectForm({
                            ...multiSelectForm,
                            parameterIds: [...currentIds, param.id],
                            parameterValues: { ...multiSelectForm.parameterValues, [param.id]: '' },
                          });
                        } else {
                          const newValues = { ...multiSelectForm.parameterValues };
                          delete newValues[param.id];
                          setMultiSelectForm({
                            ...multiSelectForm,
                            parameterIds: currentIds.filter((id) => id !== param.id),
                            parameterValues: newValues,
                          });
                        }
                      }}
                      className="rounded"
                    />
                    <label
                      htmlFor={`param-${param.id}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {param.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            {multiSelectForm.parameterIds && multiSelectForm.parameterIds.length > 0 && (
              <div className="space-y-4">
                <Separator />
                <Label>Set Values for Selected Parameters</Label>
                {multiSelectForm.parameterIds.map((paramId) => {
                  const param = ratingParameters.find((p) => p.id === paramId);
                  if (!param) return null;

                  if (param.options && param.options.length > 0) {
                    return (
                      <div key={paramId} className="space-y-2">
                        <Label>{param.label}</Label>
                        <Select
                          value={multiSelectForm.parameterValues?.[paramId] || ''}
                          onValueChange={(value) => {
                            setMultiSelectForm({
                              ...multiSelectForm,
                              parameterValues: {
                                ...multiSelectForm.parameterValues,
                                [paramId]: value,
                              },
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`Select ${param.label}`} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any</SelectItem>
                            {param.options.map((option) => (
                              <SelectItem
                                key={typeof option === 'string' ? option : option.value}
                                value={typeof option === 'string' ? option : option.value}
                              >
                                {typeof option === 'string' ? option : option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  }
                  return (
                    <div key={paramId} className="space-y-2">
                      <Label>{param.label}</Label>
                      <Input
                        value={multiSelectForm.parameterValues?.[paramId] || ''}
                        onChange={(e) => {
                          setMultiSelectForm({
                            ...multiSelectForm,
                            parameterValues: {
                              ...multiSelectForm.parameterValues,
                              [paramId]: e.target.value,
                            },
                          });
                        }}
                        placeholder={`Enter ${param.label}`}
                      />
                    </div>
                  );
                })}
              </div>
            )}
            <div className="space-y-2">
              <Label>Rate *</Label>
              <Input
                type="number"
                step="0.01"
                value={multiSelectForm.rate}
                onChange={(e) =>
                  setMultiSelectForm({ ...multiSelectForm, rate: parseFloat(e.target.value) || 0 })
                }
                placeholder="Enter rate"
              />
            </div>
            <div className="space-y-2">
              <Label>Rate Type *</Label>
              <Select
                value={multiSelectForm.rateType}
                onValueChange={(value: 'percentage' | 'fixed') =>
                  setMultiSelectForm({ ...multiSelectForm, rateType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount (AED)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMultiSelectDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMultiSelectRate}>Add Rate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Formula Builder Dialog */}
      <Dialog
        open={isFormulaBuilderOpen}
        onOpenChange={(open) => {
          setIsFormulaBuilderOpen(open);
          if (open) {
            // Load existing formula when opening
            if (selectedCalculation === 'sumInsured') {
              setFormulaSteps(reindexFormula([...sumInsuredFormula]));
            } else if (selectedCalculation === 'premium') {
              setFormulaSteps(reindexFormula([...premiumFormula]));
            }
          } else {
            // Clear when closing
            setFormulaSteps([]);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Formula Builder -{' '}
              {selectedCalculation === 'sumInsured'
                ? 'Total Sum Insured Calculation'
                : selectedCalculation === 'premium'
                  ? 'Premium Calculation'
                  : 'Formula Builder'}
            </DialogTitle>
            <DialogDescription>
              Build custom formulas for{' '}
              {selectedCalculation === 'sumInsured'
                ? 'sum insured'
                : selectedCalculation === 'premium'
                  ? 'premium'
                  : ''}{' '}
              calculation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <Label>Available Fields</Label>
                  <div className="space-y-2 mt-2">
                    {ratingParameters.map((param) => (
                      <Button
                        key={param.id}
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => {
                          setFormulaSteps(
                            reindexFormula([
                              ...formulaSteps,
                              {
                                id: `step_${Date.now()}`,
                                type: 'field',
                                value: param.name,
                                label: param.label,
                              },
                            ]),
                          );
                        }}
                      >
                        {param.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Operators</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {['+', '-', '*', '/'].map((op) => (
                      <Button
                        key={op}
                        variant="outline"
                        onClick={() => {
                          setFormulaSteps(
                            reindexFormula([
                              ...formulaSteps,
                              {
                                id: `step_${Date.now()}`,
                                type: 'operator',
                                value: op,
                              },
                            ]),
                          );
                        }}
                      >
                        {op}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Formula Preview</Label>
                  <div className="p-4 border rounded-lg bg-muted/30 min-h-[200px] mt-2">
                    {formulaSteps.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Add fields and operators to build your formula
                      </p>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        {formulaSteps.map((step, index) => (
                          <React.Fragment key={step.id}>
                            {step.type === 'field' && (
                              <Badge variant="default">{step.label || step.value}</Badge>
                            )}
                            {step.type === 'variable' && (
                              <Badge
                                variant="default"
                                className="bg-purple-100 text-purple-900 border-purple-200"
                              >
                                {step.label ||
                                  (step.value === 'sumInsured'
                                    ? 'Sum Insured'
                                    : step.value === 'baseRate'
                                      ? 'Base Rate'
                                      : step.value)}
                              </Badge>
                            )}
                            {step.type === 'operator' && (
                              <span className="font-mono text-lg">{step.value}</span>
                            )}
                            {step.type === 'number' && (
                              <span className="font-mono">{step.value}</span>
                            )}
                            {step.type === 'percentage' && (
                              <span className="font-mono">{step.value}%</span>
                            )}
                            {index < formulaSteps.length - 1 && (
                              <span className="text-muted-foreground">→</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Enter number"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value) {
                        setFormulaSteps(
                          reindexFormula([
                            ...formulaSteps,
                            {
                              id: `step_${Date.now()}`,
                              type: 'number',
                              value: e.currentTarget.value,
                            },
                          ]),
                        );
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <Button variant="outline" onClick={() => setFormulaSteps([])}>
                    Clear
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Formula Examples</Label>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Sum Insured = (field1 + field2)</p>
                <p>• Sum Insured = (field1 * 0.5) + field2</p>
                <p>• BasePremium = (SumInsured * Rate) + (Loading - Discount)</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsFormulaBuilderOpen(false);
                setFormulaSteps([]);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (formulaSteps.length === 0) {
                  toast({
                    title: 'Validation Error',
                    description: 'Please add at least one step to the formula.',
                    variant: 'destructive',
                  });
                  return;
                }

                // Save to appropriate formula based on selected calculation
                if (selectedCalculation === 'sumInsured') {
                  setSumInsuredFormula(formulaSteps);
                  toast({
                    title: 'Formula Saved',
                    description:
                      'Total Sum Insured calculation formula has been saved successfully.',
                  });
                } else if (selectedCalculation === 'premium') {
                  setPremiumFormula(formulaSteps);
                  toast({
                    title: 'Formula Saved',
                    description: 'Premium calculation formula has been saved successfully.',
                  });
                } else {
                  // Default behavior (for backward compatibility)
                  toast({
                    title: 'Formula Saved',
                    description: 'Formula has been saved successfully.',
                  });
                }

                setIsFormulaBuilderOpen(false);
                setFormulaSteps([]);
              }}
            >
              Save Formula
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CEW Field Configuration Dialog */}
      <Dialog open={isCEWFieldDialogOpen} onOpenChange={setIsCEWFieldDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Field</DialogTitle>
            <DialogDescription>
              Configure the field properties. Field name will be auto-generated from the label.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Field Type (Read-only) */}
            <div className="space-y-2">
              <Label>Field Type</Label>
              <Input
                value={
                  cewFieldConfig.type?.charAt(0).toUpperCase() + cewFieldConfig.type?.slice(1) || ''
                }
                disabled
                className="bg-muted"
              />
            </div>

            {/* Field Label */}
            <div className="space-y-2">
              <Label>Field Label *</Label>
              <Input
                value={cewFieldConfig.label || ''}
                onChange={(e) => {
                  const label = e.target.value;
                  const name = label
                    .toLowerCase()
                    .replace(/\s+/g, '')
                    .replace(/[^a-z0-9]/g, '');
                  setCewFieldConfig({
                    ...cewFieldConfig,
                    label,
                    name,
                  });
                }}
                placeholder="Enter field label"
              />
              <p className="text-xs text-muted-foreground">
                Field name:{' '}
                <span className="font-mono">{cewFieldConfig.name || 'auto-generated'}</span>
              </p>
            </div>

            {/* Placeholder */}
            <div className="space-y-2">
              <Label>Placeholder</Label>
              <Input
                value={cewFieldConfig.placeholder || ''}
                onChange={(e) =>
                  setCewFieldConfig({ ...cewFieldConfig, placeholder: e.target.value })
                }
                placeholder="Enter placeholder text"
              />
            </div>

            {/* Required Field */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="cew-required"
                checked={cewFieldConfig.required || false}
                onCheckedChange={(checked) =>
                  setCewFieldConfig({ ...cewFieldConfig, required: checked === true })
                }
              />
              <Label htmlFor="cew-required" className="cursor-pointer">
                Required Field
              </Label>
            </div>

            {/* Options for Dropdown/Multiselect */}
            {(cewFieldConfig.type === 'dropdown' || cewFieldConfig.type === 'multiselect') && (
              <div className="space-y-2">
                <Label>Options *</Label>
                <Textarea
                  value={cewOptionsInput}
                  onChange={(e) => {
                    setCewOptionsInput(e.target.value);
                    const options = e.target.value
                      .split(',')
                      .map((opt) => opt.trim())
                      .filter((opt) => opt.length > 0);
                    setCewFieldConfig({ ...cewFieldConfig, options });
                  }}
                  placeholder="Enter options separated by commas (e.g., Option 1, Option 2, Option 3)"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Separate multiple options with commas
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCEWFieldDialogOpen(false);
                setCewFieldConfig({
                  type: 'text',
                  label: '',
                  name: '',
                  placeholder: '',
                  required: false,
                });
                setCewOptionsInput('');
                setSelectedCEWFieldId(null);
                setSelectedCEWSectionId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!cewFieldConfig.label?.trim()) {
                  toast({
                    title: 'Validation Error',
                    description: 'Please fill in Field Label.',
                    variant: 'destructive',
                  });
                  return;
                }

                if (
                  (cewFieldConfig.type === 'dropdown' || cewFieldConfig.type === 'multiselect') &&
                  (!cewFieldConfig.options || cewFieldConfig.options.length === 0)
                ) {
                  toast({
                    title: 'Validation Error',
                    description:
                      'Please provide at least one option for dropdown/multiselect fields.',
                    variant: 'destructive',
                  });
                  return;
                }

                const fieldName =
                  cewFieldConfig.name ||
                  cewFieldConfig.label
                    .toLowerCase()
                    .replace(/\s+/g, '')
                    .replace(/[^a-z0-9]/g, '');
                const fieldData: CEWField = {
                  id: selectedCEWFieldId || `field-${Date.now()}`,
                  type: cewFieldConfig.type!,
                  label: cewFieldConfig.label!,
                  name: fieldName,
                  placeholder: cewFieldConfig.placeholder,
                  required: cewFieldConfig.required || false,
                  options: cewFieldConfig.options,
                };

                const activePages =
                  cewFormPages.length > 0 ? cewFormPages : selectedCEW?.formPages || [];
                const pageId = activePages[0]?.id;
                const sectionId = selectedCEWSectionId || activePages[0]?.sections[0]?.id;

                if (!pageId || !sectionId) {
                  toast({
                    title: 'Error',
                    description: 'Could not find page or section to add field.',
                    variant: 'destructive',
                  });
                  return;
                }

                const updatedPages = activePages.map((page) =>
                  page.id === pageId
                    ? {
                        ...page,
                        sections: page.sections.map((section) =>
                          section.id === sectionId
                            ? {
                                ...section,
                                fields: selectedCEWFieldId
                                  ? section.fields.map((f) =>
                                      f.id === selectedCEWFieldId ? fieldData : f,
                                    )
                                  : [...section.fields, fieldData],
                              }
                            : section,
                        ),
                      }
                    : page,
                );

                if (cewFormPages.length > 0) {
                  setCewFormPages(updatedPages);
                } else {
                  setCewFormPages(updatedPages);
                  setSelectedCEW({ ...selectedCEW, formPages: updatedPages });
                }

                setIsCEWFieldDialogOpen(false);
                setCewFieldConfig({
                  type: 'text',
                  label: '',
                  name: '',
                  placeholder: '',
                  required: false,
                });
                setCewOptionsInput('');
                setSelectedCEWFieldId(null);
                setSelectedCEWSectionId(null);

                toast({
                  title: selectedCEWFieldId ? 'Field Updated' : 'Field Added',
                  description: `${fieldData.label} has been ${
                    selectedCEWFieldId ? 'updated' : 'added'
                  } to the form.`,
                });
              }}
            >
              {selectedCEWFieldId ? 'Update Field' : 'Add Field'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Playground Dialog */}
      <Dialog open={isPlaygroundOpen} onOpenChange={setIsPlaygroundOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {playgroundType === 'calculation'
                ? `${
                    selectedCalculation === 'sumInsured' ? 'Total Sum Insured' : 'Premium'
                  } Calculation Playground`
                : 'Rating Configuration Playground'}
            </DialogTitle>
            <DialogDescription>
              Test your formula with different input values to see the calculated result
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {playgroundType === 'calculation' && selectedCalculation && (
              <>
                {/* Input Values Section */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Input Test Values</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {(() => {
                      const currentFormula =
                        selectedCalculation === 'sumInsured' ? sumInsuredFormula : premiumFormula;
                      const requiredFields = currentFormula
                        .filter((step) => step.type === 'field')
                        .map((step) => step.value)
                        .filter((value, index, self) => self.indexOf(value) === index); // Unique values

                      return requiredFields.map((fieldName) => {
                        const param = ratingParameters.find((p) => p.name === fieldName);
                        return (
                          <div key={fieldName} className="space-y-2">
                            <Label>{param?.label || fieldName}</Label>
                            {param?.type === 'dropdown' ? (
                              <Select
                                value={(playgroundTestValues[fieldName] as string) || ''}
                                onValueChange={(value) => {
                                  setPlaygroundTestValues({
                                    ...playgroundTestValues,
                                    [fieldName]: value,
                                  });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={`Select ${param?.label || fieldName}`}
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {param?.options?.map((opt) => (
                                    <SelectItem
                                      key={typeof opt === 'string' ? opt : opt.value}
                                      value={typeof opt === 'string' ? opt : opt.value}
                                    >
                                      {typeof opt === 'string' ? opt : opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                type={param?.type === 'number' ? 'number' : 'text'}
                                value={(playgroundTestValues[fieldName] as string | number) || ''}
                                onChange={(e) => {
                                  const value =
                                    param?.type === 'number'
                                      ? parseFloat(e.target.value) || 0
                                      : e.target.value;
                                  setPlaygroundTestValues({
                                    ...playgroundTestValues,
                                    [fieldName]: value,
                                  });
                                }}
                                placeholder={`Enter ${param?.label || fieldName}`}
                              />
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Formula Display */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Formula</Label>
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2 flex-wrap">
                      {(() => {
                        const currentFormula =
                          selectedCalculation === 'sumInsured' ? sumInsuredFormula : premiumFormula;
                        return currentFormula.map((step) => (
                          <React.Fragment key={step.id}>
                            {step.type === 'field' &&
                              (() => {
                                const param = ratingParameters.find((p) => p.name === step.value);
                                let displayLabel = step.value;
                                if (param) {
                                  displayLabel = param.label;
                                } else if (
                                  typeof step.value === 'string' &&
                                  step.value.startsWith('matrix:')
                                ) {
                                  const parts = step.value.split(':');
                                  if (parts.length === 3) {
                                    const [_, fieldId1, fieldId2] = parts;
                                    const mp = matrixParameters.find(
                                      (item) =>
                                        item.formFieldId === fieldId1 &&
                                        item.formFieldId2 === fieldId2,
                                    );
                                    if (mp) {
                                      const field1 = ratingParameters.find(
                                        (p) => p.id === mp.formFieldId,
                                      );
                                      const field2 = ratingParameters.find(
                                        (p) => p.id === mp.formFieldId2,
                                      );
                                      displayLabel =
                                        mp.name ||
                                        `${field1?.label || mp.formFieldId} × ${
                                          field2?.label || mp.formFieldId2
                                        }`;
                                    }
                                  }
                                }
                                return <Badge variant="default">{displayLabel}</Badge>;
                              })()}
                            {step.type === 'operator' && (
                              <span className="font-mono text-xl text-primary font-bold">
                                {step.value}
                              </span>
                            )}
                            {step.type === 'function' && (
                              <Badge variant="secondary">
                                {step.value === 'SUM_PRODUCT_EACH'
                                  ? 'SUM PRODUCT Each'
                                  : step.value === 'PRODUCT_EACH'
                                    ? 'PRODUCT Each'
                                    : step.value}
                              </Badge>
                            )}
                            {step.type === 'number' && (
                              <span className="font-mono text-lg">{step.value}</span>
                            )}
                            {step.type === 'percentage' && (
                              <span className="font-mono text-lg text-primary">{step.value}%</span>
                            )}
                          </React.Fragment>
                        ));
                      })()}
                    </div>
                  </div>
                </div>

                {/* Calculate Button */}
                <Button
                  className="w-full"
                  onClick={() => {
                    const currentFormula =
                      selectedCalculation === 'sumInsured' ? sumInsuredFormula : premiumFormula;
                    const result = evaluateFormula(currentFormula, playgroundTestValues);
                    if (result === null) {
                      toast({
                        title: 'Calculation Error',
                        description: 'Please fill in all required values or check your formula.',
                        variant: 'destructive',
                      });
                    } else {
                      setPlaygroundResult(result);
                    }
                  }}
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculate Result
                </Button>

                {/* Result Display */}
                {playgroundResult !== null && (
                  <div className="p-6 border rounded-lg bg-primary/10 border-primary">
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Calculated Result</Label>
                      <div className="text-3xl font-bold text-primary">
                        {playgroundResult.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        AED
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {selectedCalculation === 'sumInsured' ? 'Total Sum Insured' : 'Premium'}{' '}
                        based on your formula and test values
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPlaygroundOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Matrix Parameter Dialog */}
      <Dialog
        open={isMatrixDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            resetMatrixDialogState();
            return;
          }
          setIsMatrixDialogOpen(true);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingMatrixParameter ? 'Edit Matrix Parameter' : 'Add Matrix Parameter'}
            </DialogTitle>
            <DialogDescription>
              Select exactly two fields to create a matrix parameter definition.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Matrix Name</Label>
              <Input
                value={matrixParameterName}
                onChange={(e) => setMatrixParameterName(e.target.value)}
                placeholder="e.g. Industry x Turnover"
              />
            </div>
            <div className="space-y-2">
              <Label>First Field</Label>
              <Select value={matrixParameter1} onValueChange={setMatrixParameter1}>
                <SelectTrigger>
                  <SelectValue placeholder="Select first field" />
                </SelectTrigger>
                <SelectContent>
                  {matrixFieldOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Second Field</Label>
              <Select value={matrixParameter2} onValueChange={setMatrixParameter2}>
                <SelectTrigger>
                  <SelectValue placeholder="Select second field" />
                </SelectTrigger>
                <SelectContent>
                  {matrixFieldOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editingMatrixParameter && matrixChildrenChangedOnEdit && (
              <div className="rounded-md border border-amber-300 bg-amber-50 p-3 space-y-2">
                <p className="text-xs text-amber-900">
                  Changing Matrix child definitions will reset existing insurer matrix configuration
                  for this definition.
                </p>
                <label className="flex items-start gap-2 text-xs text-amber-900">
                  <Checkbox
                    checked={matrixChangeAcknowledged}
                    onCheckedChange={(checked) => setMatrixChangeAcknowledged(Boolean(checked))}
                  />
                  <span>I understand and want to reset existing insurer matrix configuration.</span>
                </label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetMatrixDialogState}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveMatrixParameter}
              disabled={
                !matrixParameter1 ||
                !matrixParameter2 ||
                (editingMatrixParameter && matrixChildrenChangedOnEdit && !matrixChangeAcknowledged)
              }
            >
              {editingMatrixParameter ? 'Save Changes' : 'Add Matrix Parameter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Combination Parameter Dialog */}
      <Dialog
        open={isCombinationDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            resetCombinationDialogState();
            return;
          }
          setIsCombinationDialogOpen(true);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingCombinationParameter
                ? 'Edit Combination Parameter'
                : 'Add Combination Parameter'}
            </DialogTitle>
            <DialogDescription>
              Choose at least two eligible rating parameters to build a combination parameter.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-6 py-2">
            {/* Left Column: Selection */}
            <div className="space-y-4 flex flex-col h-[480px]">
              <div className="space-y-2 h-[110px]">
                <div className="flex items-center justify-between h-9">
                  <Label>Available Parameters</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      setCombinationSortOption((prev) => (prev === 'asc' ? 'desc' : 'asc'))
                    }
                    title={combinationSortOption === 'asc' ? 'Sort Z to A' : 'Sort A to Z'}
                  >
                    {combinationSortOption === 'asc' ? (
                      <>
                        <ArrowDownAZ className="h-3.5 w-3.5 mr-1" />
                        A-Z
                      </>
                    ) : (
                      <>
                        <ArrowUpZA className="h-3.5 w-3.5 mr-1" />
                        Z-A
                      </>
                    )}
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search parameters..."
                    value={combinationSearchQuery}
                    onChange={(e) => setCombinationSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
              </div>
              <div className="space-y-2 flex-1 flex flex-col min-h-0">
                <div className="h-9" />
                <div className="h-[300px] overflow-auto border rounded-md p-3 space-y-2 bg-muted/30">
                  {eligibleCombinationChildren.length === 0 ? (
                    <div className="text-sm text-muted-foreground p-4 text-center h-full flex items-center justify-center">
                      No eligible parameters found.
                    </div>
                  ) : (
                    (() => {
                      const filtered = eligibleCombinationChildren
                        .filter((p) =>
                          p.label.toLowerCase().includes(combinationSearchQuery.toLowerCase()),
                        )
                        .sort((a, b) => {
                          if (combinationSortOption === 'asc') {
                            return a.label.localeCompare(b.label);
                          }
                          return b.label.localeCompare(a.label);
                        });
                      if (filtered.length === 0) {
                        return (
                          <div className="text-sm text-muted-foreground p-4 text-center h-full flex items-center justify-center">
                            No parameters match your search.
                          </div>
                        );
                      }
                      return filtered.map((param) => {
                        const checked = selectedCombinationChildIds.includes(param.id);
                        const disabled = !param.isEligible;
                        return (
                          <label
                            key={param.id}
                            className={`flex items-center justify-between p-3 rounded-md transition-all min-h-[52px] ${
                              disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                            } ${
                              checked
                                ? 'bg-primary/10 border-primary/30 border shadow-sm'
                                : disabled
                                  ? 'border border-transparent'
                                  : 'hover:bg-muted border border-transparent'
                            }`}
                            title={disabled ? param.reason : undefined}
                          >
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{param.label}</span>
                              {disabled && (
                                <span className="text-[10px] text-muted-foreground">
                                  {param.reason}
                                </span>
                              )}
                            </div>
                            <Checkbox
                              checked={checked}
                              disabled={disabled}
                              onCheckedChange={(next) => {
                                if (disabled) return;
                                setSelectedCombinationChildIds((prev) => {
                                  if (next) return [...prev, param.id];
                                  return prev.filter((id) => id !== param.id);
                                });
                              }}
                            />
                          </label>
                        );
                      });
                    })()
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Configuration */}
            <div className="space-y-4 flex flex-col h-[480px]">
              <div className="space-y-2 h-[110px]">
                <div className="flex items-center h-9">
                  <Label>
                    Combination Name <span className="text-destructive">*</span>
                  </Label>
                </div>
                <Input
                  value={combinationParameterName}
                  onChange={(e) => setCombinationParameterName(e.target.value)}
                  placeholder="e.g. BI Risk Blended Loading"
                  className="h-9"
                />
                {selectedCombinationChildIds.length >= 2 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="font-medium">Auto-generated:</span>{' '}
                    {getAutoCombinationName(selectedCombinationChildIds)}
                  </p>
                )}
              </div>

              <div className="space-y-2 flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between h-9">
                  <Label>Selected Parameters ({selectedCombinationChildIds.length})</Label>
                  {selectedCombinationChildIds.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs text-muted-foreground hover:text-destructive"
                      onClick={() => setSelectedCombinationChildIds([])}
                    >
                      Clear all
                    </Button>
                  )}
                </div>
                <div className="h-[300px] overflow-auto border rounded-md bg-muted/30 p-3">
                  {selectedCombinationChildIds.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-3">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                        <Plus className="h-6 w-6 opacity-50" />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-sm font-medium">No parameters selected</p>
                        <p className="text-xs px-4 opacity-70">
                          Select at least two parameters from the list to create a combination.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedCombinationChildIds.map((id) => {
                        const param = eligibleCombinationChildren.find((p) => p.id === id);
                        if (!param) return null;
                        return (
                          <div
                            key={id}
                            className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-md p-3 text-sm shadow-sm group min-h-[52px]"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium truncate pr-2">{param.label}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200 shrink-0 transition-opacity"
                              onClick={() =>
                                setSelectedCombinationChildIds((prev) =>
                                  prev.filter((pid) => pid !== id),
                                )
                              }
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {editingCombinationParameter && combinationChildrenChangedOnEdit && (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 space-y-2">
              <p className="text-xs text-amber-900">
                Changing Combination child definitions will reset existing insurer combination
                configuration for this definition.
              </p>
              <label className="flex items-start gap-2 text-xs text-amber-900">
                <Checkbox
                  checked={combinationChangeAcknowledged}
                  onCheckedChange={(checked) => setCombinationChangeAcknowledged(Boolean(checked))}
                />
                <span>
                  I understand and want to reset existing insurer combination configuration.
                </span>
              </label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={resetCombinationDialogState}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveCombinationParameter}
              disabled={
                !!editingCombinationParameter &&
                combinationChildrenChangedOnEdit &&
                !combinationChangeAcknowledged
              }
            >
              {editingCombinationParameter ? 'Save Changes' : 'Add Combination Parameter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Create/Edit Reference Parameter Dialog */}
      <Dialog
        open={isReferenceParameterDialogOpen}
        onOpenChange={setIsReferenceParameterDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingReferenceParameter ? 'Edit Parameter' : 'Create Parameter'}
            </DialogTitle>
            <DialogDescription>
              {editingReferenceParameter
                ? 'Update the parameter details.'
                : 'Create a new parameter derived from an original form field.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Original Form Field *</Label>
              <Select
                value={referenceFormFieldId}
                onValueChange={setReferenceFormFieldId}
                disabled={!!editingReferenceParameter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  {visibleOriginalParameters.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Label *</Label>
              <Input
                value={referenceParameterLabel}
                onChange={(e) => setReferenceParameterLabel(e.target.value)}
                placeholder="Display Label"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReferenceParameterDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateReferenceParameter}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={!!paramToDelete}
        onOpenChange={(open) => {
          if (!open) setParamToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Referenced Parameter?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the "
              {referenceParamToDelete?.label || referenceParamToDelete?.name || 'selected'}
              " referenced parameter? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteReferenceParameter}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={matrixParamIndexToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setMatrixParamIndexToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Matrix Parameter?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the "
              {matrixParamToDelete?.name || 'selected'}
              " matrix parameter? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveMatrixParameter}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={combinationParamIndexToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setCombinationParamIndexToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Combination Parameter?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the "
              {combinationParamToDelete?.name || combinationParamToDelete?.label || 'selected'}
              " combination parameter? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveCombinationParameter}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RatingConfigurator;
