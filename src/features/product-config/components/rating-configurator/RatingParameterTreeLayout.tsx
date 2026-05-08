import React, { useEffect, useMemo, useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Database,
  Grid3X3,
  Layers,
  Link2,
  Maximize2,
  Minimize2,
  Search,
  X,
} from 'lucide-react';
import type {
  Field as ProposalFormField,
  Page as ProposalFormPage,
  SubField as ProposalFormSubField,
} from '@/features/product-config/proposal-form/api/proposalFormDesign';
import type { RatingParameterDefinitionDto } from '@/features/product-config/pricing/api/ratings';
import type { DefaultRatingParam } from './types';

type Step2CategoryId = 'base' | 'factor' | 'premiumLimit';

type TreeNode = {
  id: string;
  label: string;
  kind: 'group' | 'parameter';
  nodeType:
    | 'page'
    | 'section'
    | 'field'
    | 'subfield'
    | 'parameter'
    | 'derived'
    | 'reference'
    | 'combination'
    | 'matrix';
  parameterId?: string;
  showMasterIcon?: boolean;
  children?: TreeNode[];
};

type Props = {
  activeCategory: Step2CategoryId;
  onActiveCategoryChange: (next: Step2CategoryId) => void;
  defaultRatingParamsList: DefaultRatingParam[];
  definitions: RatingParameterDefinitionDto[];
  proposalPages: ProposalFormPage[];
  onChangeDefaultRatingParamsList: (next: DefaultRatingParam[]) => void;
};

const CATEGORY_ITEMS: Array<{ id: Step2CategoryId; title: string }> = [
  { id: 'base', title: 'Base' },
  { id: 'factor', title: 'Factor' },
  { id: 'premiumLimit', title: 'Premium Limit' },
];

const TREE_LEGEND_ITEMS: Array<{ label: string; nodeType: TreeNode['nodeType'] }> = [
  { label: 'Page', nodeType: 'page' },
  { label: 'Section', nodeType: 'section' },
  { label: 'Field', nodeType: 'field' },
  { label: 'Sub', nodeType: 'subfield' },
  { label: 'Param', nodeType: 'parameter' },
  { label: 'Derived', nodeType: 'derived' },
  { label: 'Ref', nodeType: 'reference' },
  { label: 'Combo', nodeType: 'combination' },
  { label: 'Matrix', nodeType: 'matrix' },
];

function toTitleCase(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function groupIds(nodes: TreeNode[]): string[] {
  const result: string[] = [];
  for (const node of nodes) {
    if (node.kind === 'group') {
      result.push(node.id);
      if (node.children?.length) {
        result.push(...groupIds(node.children));
      }
    }
  }
  return result;
}

function matchesTokens(label: string, tokens: string[]) {
  if (tokens.length === 0) return true;
  const haystack = label.toLowerCase();
  for (const token of tokens) {
    if (!haystack.includes(token)) return false;
  }
  return true;
}

function nodeBadgeLabel(nodeType: TreeNode['nodeType']) {
  if (nodeType === 'page') return 'Page';
  if (nodeType === 'section') return 'Section';
  if (nodeType === 'field') return 'Field';
  if (nodeType === 'subfield') return 'Sub';
  if (nodeType === 'derived') return 'Derived';
  if (nodeType === 'reference') return 'Ref';
  if (nodeType === 'combination') return 'Combo';
  if (nodeType === 'matrix') return 'Matrix';
  return 'Param';
}

function nodeDotClass(nodeType: TreeNode['nodeType']) {
  if (nodeType === 'page') return 'bg-sky-500/80';
  if (nodeType === 'section') return 'bg-violet-500/80';
  if (nodeType === 'field') return 'bg-emerald-500/80';
  if (nodeType === 'subfield') return 'bg-amber-500/80';
  if (nodeType === 'derived') return 'bg-fuchsia-500/80';
  if (nodeType === 'reference') return 'bg-cyan-500/80';
  if (nodeType === 'combination') return 'bg-amber-600/80';
  if (nodeType === 'matrix') return 'bg-violet-600/80';
  return 'bg-primary/80';
}

type TopSectionMeta = {
  icon: React.ComponentType<{ className?: string }>;
  containerClassName: string;
};

function topSectionMeta(nodeId: string): TopSectionMeta | null {
  if (nodeId === 'reference-parameters') {
    return {
      icon: Link2,
      containerClassName: 'border-l-4 border-l-border bg-muted/10',
    };
  }
  if (nodeId === 'combination-parameters') {
    return {
      icon: Layers,
      containerClassName: 'border-l-4 border-l-border bg-muted/10',
    };
  }
  if (nodeId === 'matrix-parameters') {
    return {
      icon: Grid3X3,
      containerClassName: 'border-l-4 border-l-border bg-muted/10',
    };
  }
  return null;
}

export function RatingParameterTreeLayout({
  activeCategory,
  onActiveCategoryChange,
  defaultRatingParamsList,
  definitions,
  proposalPages,
  onChangeDefaultRatingParamsList,
}: Props) {
  const activeParam = defaultRatingParamsList.find((p) => p.id === activeCategory);
  const selectedIds = useMemo(
    () => activeParam?.selectedRatingParameters ?? [],
    [activeParam?.selectedRatingParameters],
  );
  const [isClearAllDialogOpen, setIsClearAllDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchTokens = useMemo(
    () => searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean),
    [searchQuery],
  );

  const formFieldToDefinition = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of definitions) {
      if (String(d.parameterType || '').toUpperCase() !== 'FORM_FIELD') continue;
      if (!d.formFieldId) continue;
      map.set(d.formFieldId, d.id);
    }
    return map;
  }, [definitions]);

  const derivedByFormFieldId = useMemo(() => {
    const map = new Map<string, RatingParameterDefinitionDto[]>();
    for (const d of definitions) {
      if (String(d.parameterType || '').toUpperCase() !== 'DERIVED') continue;
      if (!d.formFieldId) continue;
      if (d.isActive === false) continue;
      const key = `${String(d.derivedType || '').toUpperCase()}|${String(
        d.derivedSubfieldId || '',
      )}`;
      const existingList = map.get(d.formFieldId) || [];
      const byKey = new Map<string, RatingParameterDefinitionDto>();
      for (const existing of existingList) {
        const existingKey = `${String(existing.derivedType || '').toUpperCase()}|${String(
          existing.derivedSubfieldId || '',
        )}`;
        byKey.set(existingKey, existing);
      }
      const existing = byKey.get(key);
      if (!existing) {
        byKey.set(key, d);
      } else {
        const existingName = String(existing.name || existing.label || '').trim();
        const nextName = String(d.name || d.label || '').trim();
        if (!existingName && nextName) {
          byKey.set(key, d);
        } else if (existingName === nextName) {
          byKey.set(key, String(d.id).localeCompare(String(existing.id)) < 0 ? d : existing);
        }
      }
      map.set(d.formFieldId, Array.from(byKey.values()));
    }
    for (const list of map.values()) {
      list.sort((a, b) => {
        const aType = String(a.derivedType || '').toUpperCase();
        const bType = String(b.derivedType || '').toUpperCase();
        if (aType !== bType) {
          if (aType === 'COUNT') return -1;
          if (bType === 'COUNT') return 1;
          if (aType === 'SUM') return -1;
          if (bType === 'SUM') return 1;
          return aType.localeCompare(bType);
        }
        const aSub = String(a.derivedSubfieldId || '');
        const bSub = String(b.derivedSubfieldId || '');
        if (aSub !== bSub) return aSub.localeCompare(bSub);
        return String(a.name || a.label || a.id).localeCompare(String(b.name || b.label || b.id));
      });
    }
    return map;
  }, [definitions]);

  const definitionById = useMemo(() => {
    const map = new Map<string, RatingParameterDefinitionDto>();
    for (const d of definitions) map.set(d.id, d);
    return map;
  }, [definitions]);

  const proposalFieldIdSet = useMemo(() => {
    const ids = new Set<string>();
    for (const page of proposalPages || []) {
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
  }, [proposalPages]);

  const proposalFieldLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const page of proposalPages || []) {
      for (const section of page.sections || []) {
        for (const field of section.fields || []) {
          if (field.id) {
            const label = String(field.label || field.name || field.id).trim();
            if (label) map.set(field.id, label);
          }
          for (const sub of field.subFields || []) {
            if (sub.id) {
              const label = String(sub.label || sub.name || sub.id).trim();
              if (label) map.set(sub.id, label);
            }
          }
        }
      }
    }
    return map;
  }, [proposalPages]);

  const treeNodes: TreeNode[] = useMemo(() => {
    const buildParam = (
      definitionId: string,
      label: string,
      nodeType: TreeNode['nodeType'],
    ): TreeNode => ({
      id: `param:${definitionId}`,
      label,
      kind: 'parameter',
      nodeType,
      parameterId: definitionId,
    });

    const resolveDefId = (formFieldId?: string) =>
      formFieldId ? formFieldToDefinition.get(formFieldId) || null : null;

    const buildFieldNode = (field: ProposalFormField, contextId: string): TreeNode => {
      const children: TreeNode[] = [];

      const isCombinationContainer = String(field.type || '').toLowerCase() === 'combination';
      const defId = resolveDefId(field.id);
      if (!isCombinationContainer && defId) {
        children.push(buildParam(defId, field.label, 'parameter'));
      }

      const derivedDefs = field.id ? derivedByFormFieldId.get(field.id) || [] : [];

      const subFields = (field.subFields || []).filter((sf: ProposalFormSubField) =>
        Boolean(sf.isRatingParameter),
      );
      const subfieldNodeById = new Map<string, TreeNode>();
      if (subFields.length > 0) {
        for (const [idx, sf] of subFields.entries()) {
          const sfDefId = resolveDefId(sf.id);
          if (!sfDefId) continue;
          const subNode: TreeNode = {
            id: `subfield:${sf.id || `${contextId}:sub:${idx}`}`,
            label: sf.label,
            kind: 'group',
            nodeType: 'subfield',
            children: [buildParam(sfDefId, sf.label, 'parameter')],
          };
          if (sf.id) {
            subfieldNodeById.set(sf.id, subNode);
          }
          children.push(subNode);
        }
      }

      for (const d of derivedDefs) {
        const dType = String(d.derivedType || '').toUpperCase();
        if (isCombinationContainer && dType === 'SUM' && d.derivedSubfieldId) {
          const target = subfieldNodeById.get(d.derivedSubfieldId);
          if (target?.children) {
            target.children.push(
              buildParam(d.id, `${field.label} - Sum of ${target.label}`, 'derived'),
            );
            continue;
          }
        }
        if (dType === 'COUNT') {
          children.push(buildParam(d.id, `${field.label} - Total Count`, 'derived'));
        } else if (dType === 'SUM') {
          const subId = d.derivedSubfieldId || '';
          const subLabel =
            (field.subFields || []).find((s) => s.id === subId)?.label || String(subId);
          children.push(buildParam(d.id, `${field.label} - Sum of ${subLabel}`, 'derived'));
        } else {
          children.push(buildParam(d.id, d.label || d.name || d.id, 'derived'));
        }
      }

      if (children.length === 1 && children[0].kind === 'parameter') {
        return children[0];
      }

      return {
        id: `field:${field.id || contextId}`,
        label: field.label,
        kind: 'group',
        nodeType: 'field',
        children,
      };
    };

    const proposalTree: TreeNode[] = proposalPages.map((page, pageIndex) => ({
      id: `page:${page.id || pageIndex}`,
      label: page.title || `Page ${pageIndex + 1}`,
      kind: 'group',
      nodeType: 'page',
      children: (page.sections ?? []).map((section, sectionIndex) => ({
        id: `section:${section.id || `${page.id || pageIndex}-${sectionIndex}`}`,
        label: section.title || `Section ${sectionIndex + 1}`,
        kind: 'group',
        nodeType: 'section',
        children: (section.fields ?? [])
          .filter((field: ProposalFormField) => Boolean(field.isRatingParameter))
          .map((field, fieldIndex) =>
            buildFieldNode(
              field,
              `${page.id || pageIndex}:${section.id || sectionIndex}:${field.id || fieldIndex}`,
            ),
          ),
      })),
    }));

    const topSections: TreeNode[] = [];
    const referenceDefs = definitions.filter(
      (d) => String(d.parameterType || '').toUpperCase() === 'REFERENCE',
    );
    const combinationDefs = definitions.filter(
      (d) => String(d.parameterType || '').toUpperCase() === 'COMBINATION',
    );
    const matrixDefs = definitions.filter(
      (d) => String(d.parameterType || '').toUpperCase() === 'MATRIX',
    );

    if (referenceDefs.length > 0) {
      topSections.push({
        id: 'reference-parameters',
        label: 'Reference Parameters',
        kind: 'group',
        nodeType: 'reference',
        children: referenceDefs.map((d) =>
          buildParam(d.id, d.label || d.name || d.id, 'reference'),
        ),
      });
    }

    if (combinationDefs.length > 0) {
      topSections.push({
        id: 'combination-parameters',
        label: 'Combination Parameters',
        kind: 'group',
        nodeType: 'combination',
        children: combinationDefs.map((d) => {
          const name = d.label || d.name || d.id;
          const sources = (d.sources || []).slice().sort((a, b) => a.position - b.position);
          const childLabels = sources
            .map((s) => {
              if (s.type === 'FORM_FIELD') {
                const match = proposalPages
                  .flatMap((p) => p.sections || [])
                  .flatMap((sec) => sec.fields || [])
                  .flatMap((f) => [f, ...(f.subFields || [])])
                  .find((f: { id?: string; label: string }) => f.id === s.id);
                return match?.label || s.id;
              }
              const byDef = definitionById.get(s.id);
              return byDef?.label || byDef?.name || s.id;
            })
            .join(' x ');
          return buildParam(d.id, childLabels ? `${name} (${childLabels})` : name, 'parameter');
        }),
      });
    }

    if (matrixDefs.length > 0 && activeCategory === 'factor') {
      topSections.push({
        id: 'matrix-parameters',
        label: 'Matrix Parameters',
        kind: 'group',
        nodeType: 'matrix',
        children: matrixDefs.map((d) => buildParam(d.id, d.label || d.name || d.id, 'parameter')),
      });
    }

    return [...topSections, ...proposalTree];
  }, [
    definitions,
    proposalPages,
    formFieldToDefinition,
    derivedByFormFieldId,
    definitionById,
    activeCategory,
  ]);

  const labelByDefinitionId = useMemo(() => {
    const map = new Map<string, { label: string; nodeType: TreeNode['nodeType'] }>();
    const walk = (nodes: TreeNode[]) => {
      for (const n of nodes) {
        if (n.kind === 'parameter' && n.parameterId) {
          map.set(n.parameterId, { label: n.label, nodeType: n.nodeType });
        }
        if (n.children?.length) walk(n.children);
      }
    };
    walk(treeNodes);
    return map;
  }, [treeNodes]);

  const defaultExpandedIds = useMemo(() => groupIds(treeNodes), [treeNodes]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(defaultExpandedIds));

  useEffect(() => {
    setExpandedIds(new Set(defaultExpandedIds));
  }, [defaultExpandedIds]);

  const updateSelected = (nextSelected: string[]) => {
    if (!activeParam) return;
    const updated = defaultRatingParamsList.map((param) =>
      param.id === activeParam.id
        ? {
            ...param,
            selectedRatingParameters: nextSelected.length > 0 ? nextSelected : undefined,
          }
        : param,
    );
    onChangeDefaultRatingParamsList(updated);
  };

  const toggleParameter = (parameterId: string, checked: boolean) => {
    if (checked) {
      const merged = selectedIds.includes(parameterId)
        ? selectedIds
        : [...selectedIds, parameterId];
      updateSelected(merged);
      return;
    }
    updateSelected(selectedIds.filter((id) => id !== parameterId));
  };

  const invalidSelectedById = useMemo(() => {
    const invalid = new Map<string, string>();

    const validateId = (id: string) => {
      const def = definitionById.get(id);
      if (!def) {
        invalid.set(id, 'Definition not found.');
        return;
      }

      const type = String(def.parameterType || '').toUpperCase();
      if (type === 'MATRIX' || type === 'COMBINATION') {
        const sources = Array.isArray(def.sources) ? def.sources : [];
        const missing = sources.find(
          (s) => s.type === 'FORM_FIELD' && !proposalFieldIdSet.has(s.id),
        );
        if (missing) invalid.set(id, 'Source field missing in proposal design.');
        return;
      }

      const fieldId = String(def.formFieldId || '').trim();
      if (!fieldId) {
        invalid.set(id, 'Form field not linked to definition.');
        return;
      }
      if (!proposalFieldIdSet.has(fieldId)) {
        invalid.set(id, 'Form field missing in proposal design.');
      }
    };

    for (const id of selectedIds) validateId(id);
    return invalid;
  }, [selectedIds, definitionById, proposalFieldIdSet]);

  const invalidSelectedCount = invalidSelectedById.size;

  const selectedParameters = useMemo(
    () =>
      selectedIds.map((id) => {
        const def = definitionById.get(id);
        const resolved = labelByDefinitionId.get(id);
        const invalidReason = invalidSelectedById.get(id) || null;
        const defType = String(def?.parameterType || '').toUpperCase();
        const fieldId = String(def?.formFieldId || '').trim();
        const formFieldLabel =
          defType === 'FORM_FIELD' && fieldId ? proposalFieldLabelById.get(fieldId) : undefined;
        return {
          id,
          label: resolved?.label || formFieldLabel || def?.label || def?.name || id,
          nodeType:
            resolved?.nodeType ||
            (String(def?.parameterType || '').toUpperCase() === 'DERIVED'
              ? ('derived' as const)
              : ('parameter' as const)),
          showMasterIcon: false,
          isInvalid: Boolean(invalidReason),
          invalidReason,
        };
      }),
    [selectedIds, definitionById, labelByDefinitionId, invalidSelectedById, proposalFieldLabelById],
  );

  const displayedTreeNodes: TreeNode[] = useMemo(() => {
    if (searchTokens.length === 0) return treeNodes;

    const filterNodes = (nodes: TreeNode[]): TreeNode[] => {
      const result: TreeNode[] = [];
      for (const node of nodes) {
        if (node.kind === 'parameter') {
          if (matchesTokens(node.label, searchTokens)) result.push(node);
          continue;
        }

        const filteredChildren = filterNodes(node.children ?? []);
        if (matchesTokens(node.label, searchTokens) || filteredChildren.length > 0) {
          result.push({ ...node, children: filteredChildren });
        }
      }
      return result;
    };

    return filterNodes(treeNodes);
  }, [treeNodes, searchTokens]);

  const searchExpandedIds = useMemo(
    () => new Set(groupIds(displayedTreeNodes)),
    [displayedTreeNodes],
  );

  const effectiveExpandedIds = searchTokens.length > 0 ? searchExpandedIds : expandedIds;

  const selectionCountsByGroupId = useMemo(() => {
    const selectedSet = new Set(selectedIds);
    const map = new Map<string, { selected: number; total: number }>();

    const walk = (node: TreeNode): { selected: number; total: number } => {
      if (node.kind === 'parameter' && node.parameterId) {
        return { selected: selectedSet.has(node.parameterId) ? 1 : 0, total: 1 };
      }
      let selected = 0;
      let total = 0;
      for (const child of node.children ?? []) {
        const next = walk(child);
        selected += next.selected;
        total += next.total;
      }
      map.set(node.id, { selected, total });
      return { selected, total };
    };

    for (const root of treeNodes) walk(root);
    return map;
  }, [treeNodes, selectedIds]);

  const renderNode = (node: TreeNode, depth: number): React.ReactNode => {
    if (node.kind === 'parameter' && node.parameterId) {
      const checked = selectedIds.includes(node.parameterId);
      const invalidReason = checked ? invalidSelectedById.get(node.parameterId) || null : null;
      return (
        <div key={node.id} className="py-0.5" style={{ paddingLeft: `${8 + depth * 18}px` }}>
          <button
            type="button"
            onClick={() => toggleParameter(node.parameterId!, !checked)}
            className="w-full text-left"
          >
            <div
              className={`flex items-center gap-2 rounded-sm border px-2 py-1.5 transition-colors ${
                invalidReason
                  ? 'border-destructive/60 bg-destructive/10 hover:bg-destructive/15'
                  : 'border-border/70 bg-muted/20 hover:bg-muted/30'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${nodeDotClass(node.nodeType)}`} />
              <span className="text-xs flex-1 min-w-0 inline-flex items-center gap-1.5">
                <span className="truncate">{node.label}</span>
                <Badge variant="outline" className="h-4 text-[9px] px-1">
                  {nodeBadgeLabel(node.nodeType)}
                </Badge>
                {invalidReason && (
                  <span title={invalidReason} className="inline-flex">
                    <AlertTriangle
                      className="w-3.5 h-3.5 text-destructive"
                      aria-label="Invalid selection"
                    />
                  </span>
                )}
                {node.showMasterIcon && <Database className="w-3.5 h-3.5 text-primary" />}
              </span>
              <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={checked}
                  onCheckedChange={(value) => toggleParameter(node.parameterId!, Boolean(value))}
                />
              </div>
            </div>
          </button>
        </div>
      );
    }

    const children = node.children ?? [];
    const hasChildren = children.length > 0;
    const isOpen = effectiveExpandedIds.has(node.id);
    const topMeta = depth === 0 ? topSectionMeta(node.id) : null;
    const isTopSection = Boolean(topMeta);
    const counts = selectionCountsByGroupId.get(node.id);
    const TopIcon = topMeta?.icon;
    const toggleGroup = () => {
      if (searchTokens.length > 0) return;
      if (!hasChildren) return;
      setExpandedIds((previous) => {
        const next = new Set(previous);
        if (next.has(node.id)) next.delete(node.id);
        else next.add(node.id);
        return next;
      });
    };

    const getSubtreeGroupIds = () => {
      const ids: string[] = [];
      const walk = (n: TreeNode) => {
        if (n.kind === 'group') ids.push(n.id);
        for (const child of n.children ?? []) walk(child);
      };
      walk(node);
      return ids;
    };

    const expandSubtree = () => {
      const ids = getSubtreeGroupIds();
      setExpandedIds((previous) => {
        const next = new Set(previous);
        for (const id of ids) next.add(id);
        return next;
      });
    };

    const collapseSubtree = () => {
      const ids = getSubtreeGroupIds();
      setExpandedIds((previous) => {
        const next = new Set(previous);
        for (const id of ids) next.delete(id);
        return next;
      });
    };
    const subtreeGroupIds = depth === 0 ? getSubtreeGroupIds() : [];
    const isSubtreeFullyExpanded =
      subtreeGroupIds.length > 0 && subtreeGroupIds.every((id) => expandedIds.has(id));

    return (
      <div key={node.id}>
        <div className="py-0.5" style={{ paddingLeft: `${8 + depth * 18}px` }}>
          <button type="button" onClick={toggleGroup} className="w-full text-left">
            <div
              className={`flex items-center gap-2 rounded-sm border border-border/70 px-2 py-1.5 hover:bg-muted/30 transition-colors ${
                isTopSection
                  ? topMeta?.containerClassName
                  : depth === 0 && node.nodeType === 'page'
                    ? 'bg-muted/20'
                    : 'bg-background'
              }`}
            >
              {TopIcon ? (
                <TopIcon className="w-3.5 h-3.5 text-muted-foreground" />
              ) : (
                <span className={`w-1.5 h-1.5 rounded-full ${nodeDotClass(node.nodeType)}`} />
              )}
              {hasChildren ? (
                isOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                )
              ) : (
                <span className="w-3.5 h-3.5" />
              )}
              <span
                className={`flex-1 truncate ${
                  isTopSection
                    ? 'text-xs font-semibold tracking-wide'
                    : depth === 0 && node.nodeType === 'page'
                      ? 'text-xs font-semibold'
                      : 'text-xs font-medium'
                }`}
              >
                {node.label}
              </span>
              {hasChildren && depth === 0 && searchTokens.length === 0 && (
                <div
                  className="flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={isSubtreeFullyExpanded ? collapseSubtree : expandSubtree}
                    className="p-1 rounded hover:bg-muted/40 text-muted-foreground"
                    aria-label={`${isSubtreeFullyExpanded ? 'Collapse' : 'Expand'} all under ${node.label}`}
                  >
                    {isSubtreeFullyExpanded ? (
                      <Minimize2 className="w-3.5 h-3.5" />
                    ) : (
                      <Maximize2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )}
              {counts && counts.total > 0 && (
                <Badge variant="secondary" className="h-4 text-[9px] px-1">
                  {counts.selected}/{counts.total}
                </Badge>
              )}
              <Badge variant="outline" className="h-4 text-[9px] px-1">
                {nodeBadgeLabel(node.nodeType)}
              </Badge>
            </div>
          </button>
        </div>
        {hasChildren && isOpen && (
          <div
            className={`ml-3 ${
              isTopSection ? 'border-l border-border/60' : 'border-l border-dashed border-border/80'
            }`}
          >
            {children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const firstPageIndex = useMemo(
    () => displayedTreeNodes.findIndex((n) => n.nodeType === 'page'),
    [displayedTreeNodes],
  );
  const topSectionNodes = firstPageIndex > 0 ? displayedTreeNodes.slice(0, firstPageIndex) : [];
  const proposalTreeNodes =
    firstPageIndex >= 0 ? displayedTreeNodes.slice(firstPageIndex) : displayedTreeNodes;

  const expandAll = () => setExpandedIds(new Set(groupIds(treeNodes)));
  const collapseAll = () => setExpandedIds(new Set());
  const allGroupIds = defaultExpandedIds;
  const isAllExpanded = allGroupIds.length > 0 && allGroupIds.every((id) => expandedIds.has(id));

  return (
    <div className="rounded-lg border border-border overflow-hidden h-full min-h-0">
      <div className="flex h-full min-h-0">
        <div className="w-56 flex-shrink-0 border-r border-border bg-muted/30">
          <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Categories
          </p>
          {CATEGORY_ITEMS.map((item) => {
            const isActive = activeCategory === item.id;
            const count = isActive
              ? selectedIds.length
              : (defaultRatingParamsList.find((param) => param.id === item.id)
                  ?.selectedRatingParameters?.length ?? 0);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onActiveCategoryChange(item.id)}
                className={`w-full text-left p-3 rounded-lg transition-all flex items-center justify-between ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'hover:bg-muted/50 text-foreground'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Database className="w-4 h-4 flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="font-medium text-sm block truncate">{item.title}</span>
                    <span
                      className={`text-xs ${
                        isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'
                      }`}
                    >
                      {count} selected
                    </span>
                  </div>
                </div>
                <ChevronRight
                  className={`w-4 h-4 flex-shrink-0 ${
                    isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'
                  }`}
                />
              </button>
            );
          })}
        </div>

        <div className="flex-1 min-h-0">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={68} minSize={45}>
              <div className="p-4 min-h-0 flex flex-col h-full">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold">
                      {CATEGORY_ITEMS.find((item) => item.id === activeCategory)?.title ||
                        toTitleCase(activeCategory)}
                    </h3>
                    <Badge variant="secondary" className="text-[10px]">
                      {selectedIds.length} Selected
                    </Badge>
                    {invalidSelectedCount > 0 && (
                      <Badge variant="destructive" className="text-[10px]">
                        {invalidSelectedCount} Invalid
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap">
                    {TREE_LEGEND_ITEMS.map((item) => (
                      <div
                        key={item.label}
                        className="inline-flex items-center gap-1 rounded-sm border border-border bg-background px-1.5 py-0.5"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${nodeDotClass(item.nodeType)}`}
                        />
                        <span className="text-[10px] text-muted-foreground">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search parameters..."
                      className="h-8 pl-8 pr-8 text-xs"
                    />
                    {searchQuery.trim().length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted/40 text-muted-foreground"
                        aria-label="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={isAllExpanded ? collapseAll : expandAll}
                    disabled={searchTokens.length > 0}
                    className="h-8 px-2 rounded border border-border bg-background hover:bg-muted/30 text-xs inline-flex items-center gap-1 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isAllExpanded ? (
                      <Minimize2 className="w-3.5 h-3.5" />
                    ) : (
                      <Maximize2 className="w-3.5 h-3.5" />
                    )}
                    {isAllExpanded ? 'Collapse all' : 'Expand all'}
                  </button>
                </div>

                <div className="mt-2 rounded-md border border-border bg-background flex-1 min-h-0 overflow-auto p-2">
                  {displayedTreeNodes.length === 0 ? (
                    <div className="h-full rounded-md border border-dashed border-border bg-background/70 flex items-center justify-center text-xs text-muted-foreground px-4 text-center">
                      No matches for &quot;{searchQuery.trim()}&quot;.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {topSectionNodes.length > 0 && (
                        <div className="px-1 pt-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                          Created Parameters
                        </div>
                      )}
                      {topSectionNodes.map((node) => renderNode(node, 0))}
                      {topSectionNodes.length > 0 && proposalTreeNodes.length > 0 && (
                        <div className="border-t border-border/60 pt-2">
                          <div className="px-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                            Proposal Form
                          </div>
                        </div>
                      )}
                      {proposalTreeNodes.map((node) => renderNode(node, 0))}
                    </div>
                  )}
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={32} minSize={20} maxSize={55}>
              <div className="bg-muted/10 p-4 min-h-0 h-full">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">
                      Selected{' '}
                      {CATEGORY_ITEMS.find((item) => item.id === activeCategory)?.title ||
                        toTitleCase(activeCategory)}{' '}
                      Parameters
                    </h3>
                    <Badge variant="secondary" className="text-[10px]">
                      {selectedParameters.length}
                    </Badge>
                    {invalidSelectedCount > 0 && (
                      <Badge variant="destructive" className="text-[10px]">
                        {invalidSelectedCount} Invalid
                      </Badge>
                    )}
                  </div>
                  {selectedParameters.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsClearAllDialogOpen(true)}
                      className="text-[10px] px-2 py-1 rounded border border-destructive/40 text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                    >
                      Remove All
                    </button>
                  )}
                </div>
                {selectedParameters.length === 0 ? (
                  <div className="h-full rounded-md border border-dashed border-border bg-background/70 flex items-center justify-center text-xs text-muted-foreground px-4 text-center">
                    No selections in this category yet.
                  </div>
                ) : (
                  <div className="h-[calc(100%-32px)] rounded-md border border-border bg-background overflow-auto p-2 space-y-1.5">
                    {selectedParameters.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-start gap-2 rounded-sm border px-2 py-1.5 ${
                          item.isInvalid
                            ? 'border-destructive/60 bg-destructive/10'
                            : 'border-border/70 bg-muted/20'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full mt-1 ${nodeDotClass(item.nodeType)}`}
                        />
                        {item.isInvalid && (
                          <span
                            title={item.invalidReason || 'Invalid selection'}
                            className="inline-flex self-start mt-0.5"
                          >
                            <AlertTriangle
                              className="w-3.5 h-3.5 text-destructive"
                              aria-label="Invalid selection"
                            />
                          </span>
                        )}
                        <span className="text-xs flex-1 min-w-0 whitespace-normal break-words leading-snug">
                          {item.label}
                        </span>
                        <Badge variant="outline" className="h-4 text-[9px] px-1 self-start">
                          {nodeBadgeLabel(item.nodeType)}
                        </Badge>
                        {item.showMasterIcon && (
                          <Database className="w-3.5 h-3.5 text-primary self-start mt-0.5" />
                        )}
                        <button
                          type="button"
                          onClick={() => toggleParameter(item.id, false)}
                          className="p-1 rounded text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200 self-start -mt-0.5"
                          aria-label={`Remove ${item.label}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
      <AlertDialog open={isClearAllDialogOpen} onOpenChange={setIsClearAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove all selected items?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all selected items from{' '}
              {CATEGORY_ITEMS.find((item) => item.id === activeCategory)?.title ||
                toTitleCase(activeCategory)}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => updateSelected([])}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

