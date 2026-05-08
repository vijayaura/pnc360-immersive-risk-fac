import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollableTabs } from '@/components/ui/ScrollableTabs';
import { DatePicker } from '@/components/ui/date-picker';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Circle,
  Copy,
  FileText,
  FolderOpen,
  Loader2,
  Pencil,
  Plus,
  Shield,
  Trash2,
} from 'lucide-react';
import { format, getYear } from 'date-fns';
import { cn } from '@/shared/utils/lib-utils';
import { useToast } from '@/shared/hooks/use-toast';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { getProduct } from '@/features/product-config/api/products';
import type { ProductSection, ProductCover } from '@/features/product-config/api/products';
import { listReinsurers, listReinsurerGrades } from '@/features/reinsurers/api/reinsurers';
import type { Reinsurer } from '@/features/reinsurers/api/reinsurers';
import { listReinsuranceBrokers } from '@/features/reinsurance-brokers/api/reinsurance-brokers';
import type { ReinsuranceBroker } from '@/features/reinsurance-brokers/api/reinsurance-brokers';
import { listBrokersViaManagement } from '@/features/brokers/api/brokers';
import type { BrokerManagementResponse } from '@/features/brokers/api/brokers';
import {
  createReinsuranceProgram,
  updateReinsuranceProgram,
  deleteReinsuranceProgram,
  listReinsuranceProgramsByCover,
  listReinsuranceTreatiesByProgram,
  createReinsuranceTreaty,
  updateReinsuranceTreaty,
  deleteReinsuranceTreaty,
  buildCreateProgramPayload,
  buildUpdateProgramPayload,
  buildTreatyPayload,
  cloneReinsuranceTreaty,
} from '@/features/product-config/api/reinsurance';
import { TreatyStructureSection } from '@/features/product-config/components/reinsurance/TreatyStructureSection';
import {
  TreatyStructureReadOnly,
  PARAM_LABELS,
  OP_LABELS,
} from '@/features/product-config/components/reinsurance/TreatyStructureReadOnly';
import { TreatyTriggerConditionsEditor } from '@/features/product-config/components/reinsurance/TreatyTriggerConditionsEditor';
import type {
  CoverProgram,
  TreatyStructure,
  TreatyStructureType,
  FacultativePanelMember,
} from '@/features/product-config/components/reinsurance/types';
import {
  createEmptyProgram,
  createNewTreatyStructure,
  genId,
} from '@/features/product-config/components/reinsurance/types';
import { findSameTypeDateOverlap } from '@/features/product-config/components/reinsurance/treatyDateOverlapValidation';
import { findSurplusChainError } from '@/features/product-config/components/reinsurance/surplusTriggerValidation';

// ─────────────────────────────────────────────────────────────────────────────
// Local types
// ─────────────────────────────────────────────────────────────────────────────

interface SectionInfo {
  id: string;
  name: string;
  covers: Array<{ id: string; name: string }>;
}

/** Equal split across every onboarded reinsurer (aligned with handleCreateProgram share logic). */
function defaultFacultativePanelAllReinsurers(reinsurers: Reinsurer[]): FacultativePanelMember[] {
  if (reinsurers.length === 0) return [];
  const base = parseFloat((100 / reinsurers.length).toFixed(4));
  const allocated = parseFloat((base * (reinsurers.length - 1)).toFixed(4));
  const remainder = parseFloat((100 - allocated).toFixed(4));
  return reinsurers.map((r, i) => ({
    reinsurerOrganizationId: r.id,
    sharePercent: i === reinsurers.length - 1 ? remainder : base,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

const CoverReinsuranceSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const productId = searchParams.get('productId') || '';
  const productName = searchParams.get('productName') || 'Product';
  const organizationIdFromUrl = searchParams.get('organizationId') || '';
  const authUser = useAuthStore((state) => state.user);

  // ── Product structure ──────────────────────────────────────────────────────
  const [sections, setSections] = useState<SectionInfo[]>([]);
  const [isMultiCover, setIsMultiCover] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  /** organizationId from getProduct() — required for program creation */
  const [productOrganizationId, setProductOrganizationId] = useState('');
  /** Currency from the product — used as default for new treaty structures */
  const [productCurrency, setProductCurrency] = useState('AED');
  /** Validity dates from Product Studio — used to bound all program/treaty date pickers */
  const [productValidityStartDate, setProductValidityStartDate] = useState<string | null>(null);
  const [productValidityEndDate, setProductValidityEndDate] = useState<string | null>(null);

  // ── Cover selection ────────────────────────────────────────────────────────
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedCoverId, setSelectedCoverId] = useState<string | null>(null);

  // ── Reinsurers & brokers for panel dropdowns ─────────────────────────────
  const [onboardedReinsurers, setOnboardedReinsurers] = useState<Reinsurer[]>([]);
  const [onboardedBrokers, setOnboardedBrokers] = useState<ReinsuranceBroker[]>([]);
  const [allBrokers, setAllBrokers] = useState<BrokerManagementResponse[]>([]);

  // ── Programs keyed by coverId (API-backed) ─────────────────────────────────
  const [programsByCover, setProgramsByCover] = useState<Record<string, CoverProgram[]>>({});
  const [isProgramsLoading, setIsProgramsLoading] = useState(false);

  // ── Draft state for "Create New Program" tab ───────────────────────────────
  const [programDraft, setProgramDraft] = useState<CoverProgram>(createEmptyProgram());
  const [isCreating, setIsCreating] = useState(false);

  // ── Programs list view & treaty detail ────────────────────────────────────
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [selectedProgramTreaties, setSelectedProgramTreaties] = useState<TreatyStructure[]>([]);
  const [isTreatiesLoading, setIsTreatiesLoading] = useState(false);
  const [isDeletingProgramId, setIsDeletingProgramId] = useState<string | null>(null);

  // ── Tab & edit state ───────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'create' | 'programs'>('create');
  /** When set, "Create Program" form operates in update mode */
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  /** Treaty IDs (real UUIDs) removed during an edit session — sent as DELETE on save */
  const [deletedTreatyIds, setDeletedTreatyIds] = useState<string[]>([]);

  // ── Clone dialog (clone TO another cover) ──────────────────────────────────
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [cloneTargetSectionId, setCloneTargetSectionId] = useState<string | null>(null);
  const [cloneTargetCoverId, setCloneTargetCoverId] = useState<string | null>(null);
  const [isCloning, setIsCloning] = useState(false);

  // ── Clone-from dialog (clone FROM another cover into current empty cover) ─
  const [cloneFromDialogOpen, setCloneFromDialogOpen] = useState(false);
  const [cloneSourceSectionId, setCloneSourceSectionId] = useState<string | null>(null);
  const [cloneSourceCoverId, setCloneSourceCoverId] = useState<string | null>(null);
  const [cloneSourceProgramId, setCloneSourceProgramId] = useState<string | null>(null);
  const [isCloneFromLoading, setIsCloneFromLoading] = useState(false);

  // ── Unsaved changes guard ───────────────────────────────────────────────────
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [isSavingAndExiting, setIsSavingAndExiting] = useState(false);
  const cleanDraftRef = useRef<string>(JSON.stringify(createEmptyProgram()));
  /** After user changes facultative checkboxes, do not auto-select all reinsurers again. */
  const facultativePanelUserTouchedRef = useRef(false);

  const isDirty = useCallback(() => {
    return JSON.stringify(programDraft) !== cleanDraftRef.current;
  }, [programDraft]);

  const handleBack = useCallback(() => {
    if (isDirty()) {
      setShowExitDialog(true);
    } else {
      navigate(-1);
    }
  }, [isDirty, navigate]);

  // ── Load product structure ─────────────────────────────────────────────────

  useEffect(() => {
    if (!productId) return;

    const load = async () => {
      setIsLoadingProduct(true);
      try {
        const product = await getProduct(productId);
        const multi = product.productType === 'Multi Cover';
        setIsMultiCover(multi);
        setProductOrganizationId(product.organizationId ?? '');
        setProductCurrency(product.currency || 'AED');
        setProductValidityStartDate(product.validityStartDate ?? null);
        setProductValidityEndDate(product.validityEndDate ?? null);

        const loaded: SectionInfo[] = (product.sections ?? []).map((s: ProductSection) => ({
          id: s.id ?? `section-${s.name}`,
          name: s.name,
          covers: (s.covers ?? []).map((c: ProductCover) => ({
            id: c.id ?? `cover-${c.name}`,
            name: c.name,
          })),
        }));
        setSections(loaded);

        if (loaded.length > 0) {
          setSelectedSectionId(loaded[0].id);
          const firstCover = loaded[0].covers[0];
          if (firstCover) setSelectedCoverId(firstCover.id);
        }
      } catch {
        toast({
          title: 'Failed to load product',
          description: 'Could not fetch product structure. Please go back and try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingProduct(false);
      }
    };

    load();
  }, [productId, toast]);

  useEffect(() => {
    Promise.all([listReinsurers({ limit: 100, status: 'active' }), listReinsurerGrades()])
      .then(([res, grades]) => {
        const gradeMap = Object.fromEntries((grades || []).map((g) => [g.id, g.valueLabel]));
        const enriched = (res.data || []).map((r) => ({
          ...r,
          grade: gradeMap[r.gradeId || ''] || undefined,
        }));
        setOnboardedReinsurers(enriched);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    listReinsuranceBrokers({ limit: 100, status: 'active' })
      .then((res) => {
        console.log('[CoverReinsuranceSetup] reinsurance brokers loaded:', res.data?.length);
        setOnboardedBrokers(res.data);
      })
      .catch((err) => console.error('[CoverReinsuranceSetup] reinsurance broker fetch failed:', err));
  }, []);

  useEffect(() => {
    listBrokersViaManagement('', { limit: 100, status: 'ACTIVE' })
      .then((res) => {
        console.log('[CoverReinsuranceSetup] all brokers loaded:', res.data?.length);
        setAllBrokers(res.data);
      })
      .catch((err) => console.error('[CoverReinsuranceSetup] all brokers fetch failed:', err));
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────

  const effectiveOrgId =
    productOrganizationId ||
    organizationIdFromUrl ||
    authUser?.organizationId ||
    authUser?.organization_id ||
    authUser?.marketId ||
    null;

  const allCovers = sections.flatMap((s) => s.covers);
  // For single-cover products use productId as the coverId — it's a real UUID and the backend
  // links programs to the product when no separate cover entity exists.
  const effectiveCoverId = selectedCoverId ?? (!isMultiCover ? productId : null);
  const selectedCover = effectiveCoverId
    ? (allCovers.find((c) => c.id === effectiveCoverId) ?? null)
    : null;
  const programsList = effectiveCoverId ? (programsByCover[effectiveCoverId] ?? []) : [];
  const hasPublishedProgramOnCover = programsList.some((p) => p.active !== false);
  const hasActiveProgram = hasPublishedProgramOnCover && !editingProgramId;
  const selectedProgram = selectedProgramId
    ? (programsList.find((p) => p.id === selectedProgramId) ?? null)
    : null;

  // New program: pre-select all facultative panel reinsurers (equal %) until the user changes checkboxes.
  useEffect(() => {
    if (editingProgramId) return;
    if (facultativePanelUserTouchedRef.current) return;
    if (activeTab !== 'create') return;
    if (onboardedReinsurers.length === 0) return;
    setProgramDraft((prev) => {
      const next = {
        ...prev,
        facultativePanelReinsurers: defaultFacultativePanelAllReinsurers(onboardedReinsurers),
      };
      // Auto-population should not trigger the unsaved-changes guard.
      cleanDraftRef.current = JSON.stringify(next);
      return next;
    });
  }, [editingProgramId, activeTab, onboardedReinsurers]);

  // ── Fetch programs for ALL covers on product load (for sidebar check icons) ─

  useEffect(() => {
    if (isLoadingProduct || !productId) return;

    const fetchAll = async () => {
      if (isMultiCover) {
        // Fetch programs per-cover so the sidebar can show check icons
        const coverIds = sections.flatMap((s) => s.covers.map((c) => c.id));
        const results: Record<string, CoverProgram[]> = {};
        await Promise.all(
          coverIds.map(async (coverId) => {
            try {
              // Pass ONLY coverId (no productId) to prevent backend fallback leak
              const programs = await listReinsuranceProgramsByCover(coverId);
              results[coverId] = programs;
            } catch {
              results[coverId] = [];
            }
          }),
        );
        setProgramsByCover(results);
      } else {
        // Single-cover: use productId as key
        try {
          const programs = await listReinsuranceProgramsByCover(undefined, productId);
          setProgramsByCover({ [productId]: programs });
        } catch {
          setProgramsByCover({ [productId]: [] });
        }
      }
    };

    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingProduct, productId, isMultiCover, sections]);

  // ── Fetch programs whenever effective cover changes ────────────────────────

  useEffect(() => {
    if (!effectiveCoverId || isLoadingProduct) return;

    // Reset per-cover state
    setProgramDraft(createEmptyProgram());
    cleanDraftRef.current = JSON.stringify(createEmptyProgram());
    facultativePanelUserTouchedRef.current = false;
    setSelectedProgramId(null);
    setSelectedProgramTreaties([]);

    const fetch = async () => {
      setIsProgramsLoading(true);
      try {
        // Multi-cover: pass ONLY coverId to avoid backend product-level fallback
        // Single-cover: pass only productId
        const programs = isMultiCover
          ? await listReinsuranceProgramsByCover(selectedCoverId ?? undefined)
          : await listReinsuranceProgramsByCover(undefined, productId);
        setProgramsByCover((prev) => ({ ...prev, [effectiveCoverId]: programs }));
      } catch {
        toast({
          title: 'Failed to load programs',
          description: 'Could not fetch programs for this cover.',
          variant: 'destructive',
        });
      } finally {
        setIsProgramsLoading(false);
      }
    };
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCoverId, isLoadingProduct]);

  // ── Fetch treaties when a program is selected ──────────────────────────────

  useEffect(() => {
    if (!selectedProgramId) {
      setSelectedProgramTreaties([]);
      return;
    }

    const fetch = async () => {
      setIsTreatiesLoading(true);
      try {
        const treaties = await listReinsuranceTreatiesByProgram(selectedProgramId);
        // Resolve reinsurer display names from onboardedReinsurers
        const resolved = treaties.map((t) => ({
          ...t,
          reinsurancePanel: t.reinsurancePanel.map((p) => ({
            ...p,
            reinsurerName:
              onboardedReinsurers.find((r) => r.id === p.reinsurerId)?.name ?? p.reinsurerName,
            reinsuranceBroker:
              onboardedBrokers.find((b) => b.id === p.brokerId)?.name ??
              allBrokers.find((b) => b.id === p.brokerId)?.name ??
              p.reinsuranceBroker,
          })),
        }));
        setSelectedProgramTreaties(resolved);
      } catch {
        toast({
          title: 'Failed to load treaties',
          description: 'Could not fetch treaty details for this program.',
          variant: 'destructive',
        });
      } finally {
        setIsTreatiesLoading(false);
      }
    };
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProgramId]);

  // ── Draft handlers ────────────────────────────────────────────────────────

  const handleSelectCover = (sectionId: string, coverId: string) => {
    setSelectedSectionId(sectionId);
    setSelectedCoverId(coverId);
  };

  const handleUpdateDraft = (updates: Partial<Omit<CoverProgram, 'id' | 'treatyStructures'>>) => {
    setProgramDraft((prev) => {
      if (updates.startDate && prev.endDate && updates.startDate > prev.endDate) {
        updates.endDate = null;
      }
      if (updates.endDate && prev.startDate && updates.endDate < prev.startDate) {
        updates.startDate = null;
      }
      return { ...prev, ...updates };
    });
  };

  const handleAddTreatyStructure = (
    type: TreatyStructureType,
    initialData?: Partial<TreatyStructure>,
  ) => {
    const expiryDefault = productValidityEndDate
      ? (() => {
          const [y, m, d] = productValidityEndDate.split('-').map(Number);
          return new Date(y, m - 1, d);
        })()
      : null;
    const newStructure = {
      ...createNewTreatyStructure(type),
      currency: productCurrency,
      ...(expiryDefault ? { expiryDate: expiryDefault } : {}),
      ...initialData,
      id: genId('struct'),
    };
    setProgramDraft((prev) => ({
      ...prev,
      treatyStructures: [...prev.treatyStructures, newStructure],
    }));
  };

  const handleUpdateTreatyStructure = (id: string, updates: Partial<TreatyStructure>) => {
    setProgramDraft((prev) => ({
      ...prev,
      treatyStructures: prev.treatyStructures.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
  };

  const handleDeleteTreatyStructure = (id: string) => {
    // If editing and the ID is a real UUID (not a temp struct_ id), track for DELETE on save
    if (editingProgramId && !id.startsWith('struct_')) {
      setDeletedTreatyIds((prev) => [...prev, id]);
    }
    setProgramDraft((prev) => {
      const updated = prev.treatyStructures.filter((s) => s.id !== id);
      return { ...prev, treatyStructures: updated };
    });
  };

  // ── Edit program (load into form) ─────────────────────────────────────────

  const handleEditProgram = (program: CoverProgram, treaties: TreatyStructure[]) => {
    // Always pre-select all reinsurers in facultative panel
    const facPanel = defaultFacultativePanelAllReinsurers(onboardedReinsurers);
    const draft = { ...program, treatyStructures: treaties, facultativePanelReinsurers: facPanel };
    setEditingProgramId(program.id);
    facultativePanelUserTouchedRef.current = true;
    setProgramDraft(draft);
    cleanDraftRef.current = JSON.stringify(draft);
    setSelectedProgramId(null);
    setSelectedProgramTreaties([]);
    setDeletedTreatyIds([]);
    setActiveTab('create');
  };

  // ── Delete program (API call) ──────────────────────────────────────────────

  const handleDeleteProgram = async (programId: string) => {
    if (!effectiveCoverId) return;
    setIsDeletingProgramId(programId);
    try {
      await deleteReinsuranceProgram(programId);
      // Re-fetch: multi-cover uses coverId only; single-cover uses productId only
      const programs = isMultiCover
        ? await listReinsuranceProgramsByCover(selectedCoverId ?? undefined)
        : await listReinsuranceProgramsByCover(undefined, productId);
      setProgramsByCover((prev) => ({ ...prev, [effectiveCoverId]: programs }));
      if (selectedProgramId === programId) {
        setSelectedProgramId(null);
        setSelectedProgramTreaties([]);
      }
      toast({ title: 'Program deleted', description: 'The reinsurance program has been removed.' });
    } catch {
      toast({
        title: 'Failed to delete',
        description: 'Could not delete the program. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingProgramId(null);
    }
  };

  // ── Create / Update program (API call) ────────────────────────────────────

  const handleCreateProgram = async () => {
    if (!effectiveCoverId) return;

    // ── Mandatory header validation ──
    if (!programDraft.treatyName?.trim()) {
      toast({
        title: 'Program Name required',
        description: 'Please enter a Program Name.',
        variant: 'destructive',
      });
      return;
    }
    if (!programDraft.startDate) {
      toast({
        title: 'Effective From required',
        description: 'Please select an Effective From date.',
        variant: 'destructive',
      });
      return;
    }
    if (!programDraft.endDate) {
      toast({
        title: 'Effective To required',
        description: 'Please select an Effective To date.',
        variant: 'destructive',
      });
      return;
    }

    for (const s of programDraft.treatyStructures ?? []) {
      const panelMembers = s.reinsurancePanel ?? [];
      if (panelMembers.length === 0) continue;

      const incomplete = panelMembers.filter((p) => !p.reinsurerId);
      if (incomplete.length > 0) {
        toast({
          title: 'Incomplete panel member',
          description: `${s.structureType} (${s.name || s.treatyCode || 'layer'}): ${incomplete.length} member(s) have no reinsurer selected. Please fill in or remove empty rows.`,
          variant: 'destructive',
        });
        return;
      }

      const totalShare = panelMembers.reduce((sum, p) => sum + (p.sharePercent || 0), 0);
      if (Math.abs(totalShare - 100) > 0.01) {
        toast({
          title: 'Invalid treaty panel',
          description: `${s.structureType} (${s.name || s.treatyCode || 'layer'}): panel shares total ${totalShare.toFixed(1)}%. Must equal 100%.`,
          variant: 'destructive',
        });
        return;
      }
    }

    // ── Facultative settings validation ──
    if (programDraft.facultativeMandatory) {
      // Panel must have at least one reinsurer when facultative is mandatory
      if (programDraft.facultativePanelReinsurers.length === 0) {
        toast({
          title: 'Facultative panel required',
          description:
            'Facultative is marked as mandatory — please select at least one reinsurer in the Default Facultative Panel.',
          variant: 'destructive',
        });
        return;
      }
    }

    // Validate inclusion condition groups — every rule must have conditions and all fields filled
    for (const rule of programDraft.facultativeConditionGroups ?? []) {
      if (rule.conditions.length === 0) {
        toast({
          title: 'Empty inclusion rule',
          description:
            'Each inclusion rule must have at least one condition. Add a condition or remove the rule.',
          variant: 'destructive',
        });
        return;
      }
      for (const cond of rule.conditions) {
        const val = cond.value;
        const isEmptyValue =
          val === '' || val == null || (typeof val === 'number' && val === 0);
        if (!cond.parameterId || !cond.operator || isEmptyValue) {
          toast({
            title: 'Incomplete inclusion condition',
            description:
              'All inclusion conditions must have a parameter, operator, and a non-zero value filled in.',
            variant: 'destructive',
          });
          return;
        }
      }
    }

    // Validate exclusion condition groups — every rule must have conditions and all fields filled
    for (const rule of programDraft.facultativeExclusionConditionGroups ?? []) {
      if (rule.conditions.length === 0) {
        toast({
          title: 'Empty exclusion rule',
          description:
            'Each exclusion rule must have at least one condition. Add a condition or remove the rule.',
          variant: 'destructive',
        });
        return;
      }
      for (const cond of rule.conditions) {
        const val = cond.value;
        const isEmptyValue =
          val === '' || val == null || (typeof val === 'number' && val === 0);
        if (!cond.parameterId || !cond.operator || isEmptyValue) {
          toast({
            title: 'Incomplete exclusion condition',
            description:
              'All exclusion conditions must have a parameter, operator, and a non-zero value filled in.',
            variant: 'destructive',
          });
          return;
        }
      }
    }

    // Validate unique treaty names within the program
    const treatyNames = new Map<string, string>();
    for (const s of programDraft.treatyStructures ?? []) {
      const normalised = s.name?.trim().toLowerCase();
      if (!normalised) continue;
      if (treatyNames.has(normalised)) {
        toast({
          title: 'Duplicate treaty name',
          description: `Multiple treaties share the name "${s.name}". Each treaty must have a unique name.`,
          variant: 'destructive',
        });
        return;
      }
      treatyNames.set(normalised, s.id);
    }

    // Validate no same-type date overlaps across all treaty structures
    for (const s of programDraft.treatyStructures ?? []) {
      const overlapConflict = findSameTypeDateOverlap(
        s,
        programDraft.treatyStructures,
        s.id,
      );
      if (overlapConflict) {
        toast({
          title: 'Date range conflict',
          description: overlapConflict.message,
          variant: 'destructive',
        });
        return;
      }
    }

    // Validate surplus treaties form a valid sequential waterfall
    const chainError = findSurplusChainError(programDraft.treatyStructures ?? []);
    if (chainError) {
      toast({
        title: 'Surplus sequential ordering',
        description: chainError.message,
        variant: 'destructive',
      });
      return;
    }

    if (!effectiveOrgId) {
      toast({
        title: 'Missing organization',
        description:
          'Could not determine organization ID. Please ensure you are logged in with an organization and the product is correctly configured.',
        variant: 'destructive',
      });
      return;
    }

    const withEqualShares = (draft: typeof programDraft) => {
      const members = draft.facultativePanelReinsurers;
      if (members.length === 0) return draft;
      const base = parseFloat((100 / members.length).toFixed(4));
      const allocated = parseFloat((base * (members.length - 1)).toFixed(4));
      const remainder = parseFloat((100 - allocated).toFixed(4));
      return {
        ...draft,
        facultativePanelReinsurers: members.map((m, i) => ({
          ...m,
          sharePercent: i === members.length - 1 ? remainder : base,
        })),
      };
    };

    setIsCreating(true);
    try {
      const draftCountBeforeSave = programsList.filter((p) => p.active === false).length;
      const prepared = withEqualShares(programDraft);
      /** Create / Update Program publishes treaties as Active (evaluator only runs Active). "Save as Draft" still forces Draft. */
      const preparedWithActiveTreaties = {
        ...prepared,
        treatyStructures: prepared.treatyStructures.map((s) => ({
          ...s,
          status: 'Active' as const,
        })),
      };

      if (editingProgramId) {
        // 1. PATCH program-level fields only (treaties ignored by server on PATCH)
        // selectedCoverId is only set for multi-cover products; omit coverId for single-cover
        const programPayload = buildUpdateProgramPayload(
          prepared,
          selectedCoverId ?? undefined,
          effectiveOrgId,
          productId,
        );
        await updateReinsuranceProgram(editingProgramId, programPayload);

        // 2. Delete removed treaties
        await Promise.all(deletedTreatyIds.map((id) => deleteReinsuranceTreaty(id)));

        // 3. Create new treaties (temp IDs start with "struct_") or update existing ones
        await Promise.all(
          preparedWithActiveTreaties.treatyStructures.map((s) => {
            const treatyDto = buildTreatyPayload(s);
            if (s.id.startsWith('struct_')) {
              return createReinsuranceTreaty({
                ...treatyDto,
                reinsuranceProgramId: editingProgramId,
                productId,
              });
            }
            return updateReinsuranceTreaty(s.id, { ...treatyDto, productId });
          }),
        );
      } else {
        // For single-cover products, selectedCoverId is intentionally null → coverId: undefined in payload.
        // The backend links programs via productId alone when coverId is omitted.
        const payload = buildCreateProgramPayload(
          preparedWithActiveTreaties,
          selectedCoverId ?? undefined,
          effectiveOrgId,
          productId,
        );
        await createReinsuranceProgram(payload);
      }

      // Re-fetch: multi-cover uses coverId only; single-cover uses productId only
      const programs = isMultiCover
        ? await listReinsuranceProgramsByCover(selectedCoverId ?? undefined)
        : await listReinsuranceProgramsByCover(undefined, productId);
      setProgramsByCover((prev) => ({ ...prev, [effectiveCoverId]: programs }));

      const label = programDraft.treatyName || programDraft.treatyCode;
      toast({
        title: editingProgramId ? 'Program updated' : 'Program created',
        description:
          `Program "${label}" has been saved.` +
          (draftCountBeforeSave > 0
            ? ` ${draftCountBeforeSave} draft program${draftCountBeforeSave === 1 ? '' : 's'} ${draftCountBeforeSave === 1 ? 'is' : 'are'} still on this cover — open the Programs tab to review or delete.`
            : ''),
      });

      // Reset draft and edit state
      const freshDraft = createEmptyProgram();
      setProgramDraft(freshDraft);
      cleanDraftRef.current = JSON.stringify(freshDraft);
      facultativePanelUserTouchedRef.current = false;
      setEditingProgramId(null);
      setDeletedTreatyIds([]);
      setActiveTab('programs');
    } catch (err: unknown) {
      console.error('[handleCreateProgram] error:', err);
      const apiData = (err as { data?: { message?: string | string[] } })?.data;
      const msg =
        apiData?.message ??
        (err as Error)?.message ??
        'An error occurred while saving the program.';
      toast({
        title: editingProgramId ? 'Failed to update program' : 'Failed to create program',
        description: Array.isArray(msg) ? msg.join(', ') : String(msg),
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  // ── Save as Draft (relaxed validation) ────────────────────────────────────

  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const handleSaveDraft = async () => {
    if (!effectiveCoverId) return;

    if (!programDraft.treatyName) {
      toast({
        title: 'Missing info',
        description: 'Please enter a Program Name before saving as draft.',
        variant: 'destructive',
      });
      return;
    }

    if (!effectiveOrgId) {
      toast({
        title: 'Missing organization',
        description:
          'Could not determine organization ID. Please ensure you are logged in with an organization and the product is correctly configured.',
        variant: 'destructive',
      });
      return;
    }

    // Ensure all treaty structures have Draft status
    const draftStructures = programDraft.treatyStructures.map((s) => ({
      ...s,
      status: 'Draft' as const,
    }));
    const draftProgram = { ...programDraft, treatyStructures: draftStructures };

    setIsSavingDraft(true);
    try {
      if (editingProgramId) {
        const programPayload = buildUpdateProgramPayload(
          draftProgram,
          selectedCoverId ?? undefined,
          effectiveOrgId,
          productId,
          { programActive: false },
        );
        await updateReinsuranceProgram(editingProgramId, programPayload);

        await Promise.all(deletedTreatyIds.map((id) => deleteReinsuranceTreaty(id)));

        await Promise.all(
          draftStructures.map((s) => {
            const treatyDto = buildTreatyPayload(s);
            if (s.id.startsWith('struct_')) {
              return createReinsuranceTreaty({
                ...treatyDto,
                reinsuranceProgramId: editingProgramId,
                productId,
              });
            }
            return updateReinsuranceTreaty(s.id, { ...treatyDto, productId });
          }),
        );
      } else {
        const payload = buildCreateProgramPayload(
          draftProgram,
          selectedCoverId ?? undefined,
          effectiveOrgId,
          productId,
          { programActive: false },
        );
        await createReinsuranceProgram(payload);
      }

      const programs = isMultiCover
        ? await listReinsuranceProgramsByCover(selectedCoverId ?? undefined)
        : await listReinsuranceProgramsByCover(undefined, productId);
      setProgramsByCover((prev) => ({ ...prev, [effectiveCoverId]: programs }));

      toast({
        title: 'Draft saved',
        description: `Program "${programDraft.treatyName}" has been saved as draft.`,
      });

      const freshDraft = createEmptyProgram();
      setProgramDraft(freshDraft);
      cleanDraftRef.current = JSON.stringify(freshDraft);
      facultativePanelUserTouchedRef.current = false;
      setEditingProgramId(null);
      setDeletedTreatyIds([]);
      setActiveTab('programs');
    } catch (err: unknown) {
      console.error('[handleSaveDraft] error:', err);
      const apiData = (err as { data?: { message?: string | string[] } })?.data;
      const msg =
        apiData?.message ??
        (err as Error)?.message ??
        'An error occurred while saving the draft.';
      toast({
        title: 'Failed to save draft',
        description: Array.isArray(msg) ? msg.join(', ') : String(msg),
        variant: 'destructive',
      });
    } finally {
      setIsSavingDraft(false);
    }
  };

  // ── No product guard ──────────────────────────────────────────────────────

  if (!productId) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <p className="text-muted-foreground">
            No product selected. Go back to Product Factory and open a product first.
          </p>
          <Button variant="outline" onClick={() => navigate('/market-admin/product-management')}>
            Back to Product Factory
          </Button>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Cover Reinsurance Setup</h1>
              <p className="text-sm text-muted-foreground">
                {productName} — Configure reinsurance programs by cover
              </p>
            </div>
          </div>
        </div>
      </div>

      {isLoadingProduct ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading product structure…
        </div>
      ) : (
        <div className={cn('max-w-7xl mx-auto p-4 gap-6', isMultiCover ? 'flex' : 'flex flex-col')}>
          {/* ── Sidebar: only for multi-cover products ── */}
          {isMultiCover && (
            <Card className="w-80 flex-shrink-0 self-start">
              <CardHeader>
                <CardTitle className="text-base">Sections & Covers</CardTitle>
                <CardDescription>
                  Choose a cover to configure its reinsurance program
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {sections.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No sections or covers defined. Define product structure first.
                  </p>
                ) : (
                  sections.map((section) => (
                    <div key={section.id} className="space-y-1">
                      <button
                        type="button"
                        onClick={() => setSelectedSectionId(section.id)}
                        className={cn(
                          'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-left text-sm font-medium transition-colors',
                          selectedSectionId === section.id
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted',
                        )}
                      >
                        <FolderOpen className="w-4 h-4" />
                        {section.name}
                      </button>
                      <div className="ml-6 space-y-0.5">
                        {section.covers.map((cover) => {
                          const hasProgram = (programsByCover[cover.id]?.length ?? 0) > 0;
                          const isSelected = selectedCoverId === cover.id;
                          return (
                            <button
                              key={cover.id}
                              type="button"
                              onClick={() => handleSelectCover(section.id, cover.id)}
                              className={cn(
                                'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-left text-sm transition-colors',
                                isSelected
                                  ? 'bg-primary text-primary-foreground'
                                  : 'hover:bg-muted',
                              )}
                            >
                              <Shield className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="flex-1 min-w-0 truncate">{cover.name}</span>
                              {hasProgram ? (
                                <CheckCircle2
                                  className={cn(
                                    'w-4 h-4 flex-shrink-0',
                                    isSelected ? 'text-primary-foreground/90' : 'text-emerald-600',
                                  )}
                                />
                              ) : (
                                <Circle
                                  className={cn(
                                    'w-4 h-4 flex-shrink-0',
                                    isSelected
                                      ? 'text-primary-foreground/50'
                                      : 'text-muted-foreground/60',
                                  )}
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0 space-y-4">
            {!selectedCover && isMultiCover ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  {sections.length === 0
                    ? 'No covers defined. Define the product structure first.'
                    : 'Select a cover from the sidebar to configure its reinsurance program.'}
                </CardContent>
              </Card>
            ) : (
              <Tabs
                value={hasActiveProgram && activeTab === 'create' ? 'programs' : activeTab}
                onValueChange={(v) => setActiveTab(v as 'create' | 'programs')}
                className="w-full"
              >
                <ScrollableTabs>
                  <TabsList>
                    <TabsTrigger value="create" disabled={hasActiveProgram}>
                      {editingProgramId ? 'Edit Program' : 'Create New Program'}
                    </TabsTrigger>
                    <TabsTrigger value="programs">
                      Programs
                      {isProgramsLoading ? (
                        <Loader2 className="ml-2 w-3 h-3 animate-spin" />
                      ) : programsList.length > 0 ? (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {programsList.length}
                        </Badge>
                      ) : null}
                    </TabsTrigger>
                  </TabsList>
                </ScrollableTabs>

                {/* ── Create Tab ── */}
                <TabsContent value="create" className="space-y-4 mt-4">
                  {/* Program header fields */}
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {isMultiCover
                          ? `${selectedCover?.name} — Reinsurance Program`
                          : 'Reinsurance Program'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Program Name <span className="text-destructive">*</span></Label>
                          <Input
                            value={programDraft.treatyName}
                            onChange={(e) => handleUpdateDraft({ treatyName: e.target.value })}
                            placeholder="e.g., 2025 Motor QS Program"
                          />
                        </div>
                        <div>
                          <Label>Program Code</Label>
                          {editingProgramId ? (
                            <Input
                              value={programDraft.programCode || programDraft.treatyCode || ''}
                              disabled
                              className="bg-muted"
                            />
                          ) : (
                            <Input
                              value="Auto-generated on save"
                              disabled
                              className="bg-muted text-muted-foreground italic"
                            />
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Effective From <span className="text-destructive">*</span></Label>
                          <DatePicker
                            value={programDraft.startDate || undefined}
                            onChange={(dateString) =>
                              handleUpdateDraft({ startDate: dateString ?? null })
                            }
                            min={productValidityStartDate || undefined}
                            max={programDraft.endDate || productValidityEndDate || undefined}
                            placeholder="Select date"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Effective To <span className="text-destructive">*</span></Label>
                          <DatePicker
                            value={programDraft.endDate || undefined}
                            onChange={(dateString) =>
                              handleUpdateDraft({ endDate: dateString ?? null })
                            }
                            min={programDraft.startDate || productValidityStartDate || undefined}
                            max={productValidityEndDate || undefined}
                            placeholder="Select date"
                            className="mt-1"
                          />
                        </div>
                      </div>
                      {/* Save & Cancel inside program card */}
                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setProgramDraft(createEmptyProgram());
                            cleanDraftRef.current = JSON.stringify(createEmptyProgram());
                            facultativePanelUserTouchedRef.current = false;
                            setEditingProgramId(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => {
                            if (!programDraft.treatyName?.trim()) {
                              toast({ title: 'Program Name required', description: 'Please enter a Program Name.', variant: 'destructive' });
                              return;
                            }
                            if (!programDraft.startDate) {
                              toast({ title: 'Effective From required', description: 'Please select an Effective From date.', variant: 'destructive' });
                              return;
                            }
                            if (!programDraft.endDate) {
                              toast({ title: 'Effective To required', description: 'Please select an Effective To date.', variant: 'destructive' });
                              return;
                            }
                            handleSaveDraft();
                          }}
                          disabled={isSavingDraft || isCreating}
                          className="gap-2"
                        >
                          {isSavingDraft ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <FileText className="w-4 h-4" />
                          )}
                          {isSavingDraft ? 'Saving…' : 'Save as Draft'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Treaty structures */}
                  <TreatyStructureSection
                    treatyStructures={programDraft.treatyStructures}
                    onAddStructure={handleAddTreatyStructure}
                    onUpdateStructure={handleUpdateTreatyStructure}
                    onDeleteStructure={handleDeleteTreatyStructure}
                    reinsurers={onboardedReinsurers}
                    brokers={onboardedBrokers}
                    allBrokers={allBrokers}
                    productId={productId}
                    programStartDate={programDraft.startDate}
                    programEndDate={programDraft.endDate}
                    productValidityStartDate={productValidityStartDate}
                    productValidityEndDate={productValidityEndDate}
                    productCurrency={productCurrency}
                  />


                  <div className="flex items-center gap-2">
                    {editingProgramId && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingProgramId(null);
                          const freshDraft = createEmptyProgram();
                          setProgramDraft(freshDraft);
                          cleanDraftRef.current = JSON.stringify(freshDraft);
                          facultativePanelUserTouchedRef.current = false;
                          setActiveTab('programs');
                        }}
                      >
                        Cancel Edit
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={handleSaveDraft}
                      disabled={isSavingDraft || isCreating}
                      className="gap-2"
                    >
                      {isSavingDraft ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                      {isSavingDraft ? 'Saving…' : 'Save as Draft'}
                    </Button>
                    <Button onClick={handleCreateProgram} disabled={isCreating || isSavingDraft} className="gap-2">
                      {isCreating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      {isCreating
                        ? 'Saving…'
                        : editingProgramId
                          ? 'Update Program'
                          : 'Create Program'}
                    </Button>
                  </div>
                </TabsContent>

                {/* ── Programs Tab ── */}
                <TabsContent value="programs" className="mt-4 space-y-4">
                  {selectedProgram ? (
                    /* ── Detail view ── */
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold flex flex-wrap items-center gap-2">
                          <span>
                            {selectedProgram.treatyName || 'Program details'}
                            {selectedProgram.programCode && (
                              <span className="ml-2 text-sm font-normal text-muted-foreground">
                                {selectedProgram.programCode}
                              </span>
                            )}
                          </span>
                          {selectedProgram.active === false && (
                            <Badge
                              variant="outline"
                              className="text-[10px] uppercase tracking-wide border-amber-300 bg-amber-50 text-amber-900"
                            >
                              Draft
                            </Badge>
                          )}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={() =>
                              handleEditProgram(selectedProgram, selectedProgramTreaties)
                            }
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-destructive hover:text-destructive"
                            disabled={isDeletingProgramId === selectedProgram.id}
                            onClick={() => handleDeleteProgram(selectedProgram.id)}
                          >
                            {isDeletingProgramId === selectedProgram.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                            Delete
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => setCloneDialogOpen(true)}
                          >
                            <Copy className="w-3.5 h-3.5" />
                            Clone Program
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedProgramId(null);
                              setSelectedProgramTreaties([]);
                            }}
                          >
                            Back to list
                          </Button>
                        </div>
                      </div>

                      {/* Program overview */}
                      <div className="border border-border rounded-lg overflow-hidden">
                        <div className="px-4 py-3 border-b bg-muted/30">
                          <h4 className="font-semibold text-sm">Program Overview</h4>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4">
                          {[
                            ['Program Name', selectedProgram.treatyName || '—'],
                            [
                              'Program Code',
                              selectedProgram.programCode || selectedProgram.treatyCode || '—',
                            ],
                            [
                              'Effective From',
                              selectedProgram.startDate
                                ? format(new Date(selectedProgram.startDate), 'PPP')
                                : '—',
                            ],
                            [
                              'Effective To',
                              selectedProgram.endDate
                                ? format(new Date(selectedProgram.endDate), 'PPP')
                                : '—',
                            ],
                          ].map(([label, value]) => (
                            <div key={label} className="p-3 border-r border-b border-border">
                              <div className="text-xs text-muted-foreground mb-1">{label}</div>
                              <div className="text-sm font-medium">{value}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Treaty structures */}
                      {isTreatiesLoading ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading treaty details…
                        </div>
                      ) : selectedProgramTreaties.length > 0 ? (
                        <div className="space-y-4">
                          <h4 className="font-semibold text-sm">Treaty Structures</h4>
                          {selectedProgramTreaties.map((s, idx) => (
                            <div key={s.id}>
                              <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                                Layer {idx + 1} — {s.structureType}
                              </h4>
                              <TreatyStructureReadOnly structure={s} />
                            </div>
                          ))}
                        </div>
                      ) : null}

                    </div>
                  ) : (
                    /* ── List view ── */
                    <div className="space-y-2">
                      {isProgramsLoading ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading programs…
                        </div>
                      ) : programsList.length === 0 ? (
                        <Card>
                          <CardContent className="py-8 text-center space-y-3">
                            <p className="text-muted-foreground">
                              No programs yet. Create one in the "Create New Program" tab.
                            </p>
                            {isMultiCover && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5"
                                onClick={() => setCloneFromDialogOpen(true)}
                              >
                                <Copy className="w-3.5 h-3.5" />
                                Clone from Existing Program
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ) : (
                        programsList
                          .sort((a, b) => {
                            const da = a.startDate ? new Date(a.startDate).getTime() : 0;
                            const db = b.startDate ? new Date(b.startDate).getTime() : 0;
                            return db - da;
                          })
                          .map((p) => (
                            <Card
                              key={p.id}
                              className="cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => setSelectedProgramId(p.id)}
                            >
                              <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <FileText className="w-5 h-5 text-muted-foreground" />
                                  <div>
                                    <div className="font-medium flex flex-wrap items-center gap-2">
                                      <span>
                                        {p.treatyName || 'Unnamed program'}
                                        {p.programCode && (
                                          <span className="ml-2 text-xs text-muted-foreground font-normal">
                                            ({p.programCode})
                                          </span>
                                        )}
                                      </span>
                                      {p.active === false && (
                                        <Badge
                                          variant="outline"
                                          className="text-[10px] uppercase tracking-wide border-amber-300 bg-amber-50 text-amber-900"
                                        >
                                          Draft
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {p.startDate && p.endDate
                                        ? `${getYear(new Date(p.startDate))} — from ${format(new Date(p.startDate), 'PPP')} to ${format(new Date(p.endDate), 'PPP')}`
                                        : p.treatyCode || '—'}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    disabled={isDeletingProgramId === p.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteProgram(p.id);
                                    }}
                                  >
                                    {isDeletingProgramId === p.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </Button>
                                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                </div>
                              </CardContent>
                            </Card>
                          ))
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      )}
      {/* ── Clone Program Dialog ── */}
      <Dialog
        open={cloneDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCloneDialogOpen(false);
            setCloneTargetSectionId(null);
            setCloneTargetCoverId(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Clone Program to Another Cover</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Clone the entire program (with all treaties) to a cover that doesn't have a program
              yet.
            </p>
            {/* Step 1: Section */}
            <div className="space-y-1.5">
              <Label>Target Section</Label>
              <Select
                value={cloneTargetSectionId ?? ''}
                onValueChange={(val) => {
                  setCloneTargetSectionId(val);
                  setCloneTargetCoverId(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Step 2: Cover — only covers WITHOUT existing programs */}
            {cloneTargetSectionId &&
              (() => {
                const coversWithoutPrograms = (
                  sections.find((s) => s.id === cloneTargetSectionId)?.covers ?? []
                ).filter((c) => (programsByCover[c.id]?.length ?? 0) === 0);
                return (
                  <div className="space-y-1.5">
                    <Label>Target Cover</Label>
                    {coversWithoutPrograms.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        All covers in this section already have programs.
                      </p>
                    ) : (
                      <Select
                        value={cloneTargetCoverId ?? ''}
                        onValueChange={setCloneTargetCoverId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select cover" />
                        </SelectTrigger>
                        <SelectContent>
                          {coversWithoutPrograms.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                );
              })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloneDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!cloneTargetCoverId || isCloning}
              onClick={async () => {
                if (!cloneTargetCoverId || !selectedProgram || !effectiveOrgId) return;
                setIsCloning(true);
                try {
                  // 1. Create a new program on the target cover using source program data
                  const newProgram = await createReinsuranceProgram(
                    buildCreateProgramPayload(
                      selectedProgram,
                      cloneTargetCoverId,
                      effectiveOrgId,
                      productId,
                    ),
                  );
                  // 2. Clone each treaty from the source program into the new program
                  let count = 0;
                  for (const treaty of selectedProgramTreaties) {
                    await cloneReinsuranceTreaty(treaty.id, newProgram.id);
                    count++;
                  }
                  // 3. Refresh programs for the target cover
                  const refreshed = await listReinsuranceProgramsByCover(
                    cloneTargetCoverId,
                    productId,
                  );
                  setProgramsByCover((prev) => ({ ...prev, [cloneTargetCoverId]: refreshed }));

                  toast({
                    title: 'Program cloned',
                    description: `Program "${selectedProgram.treatyName}" with ${count} treaty structure(s) cloned successfully.`,
                  });
                  setCloneDialogOpen(false);
                  setCloneTargetSectionId(null);
                  setCloneTargetCoverId(null);
                } catch (err: unknown) {
                  console.error('[CloneTo] error:', err);
                  const apiData = (err as { data?: { message?: string | string[] } })?.data;
                  const msg =
                    apiData?.message ?? (err as Error)?.message ?? 'Could not clone program.';
                  toast({
                    title: 'Clone failed',
                    description: Array.isArray(msg) ? msg.join(', ') : String(msg),
                    variant: 'destructive',
                  });
                } finally {
                  setIsCloning(false);
                }
              }}
              className="gap-2"
            >
              {isCloning && <Loader2 className="w-4 h-4 animate-spin" />}
              {isCloning ? 'Cloning…' : 'Clone Program'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Clone From Existing Program Dialog ── */}
      <Dialog
        open={cloneFromDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCloneFromDialogOpen(false);
            setCloneSourceSectionId(null);
            setCloneSourceCoverId(null);
            setCloneSourceProgramId(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Clone Program from Another Cover</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Select a source program to clone into this cover.
            </p>
            {/* Step 1: Source Section */}
            <div className="space-y-1.5">
              <Label>Source Section</Label>
              <Select
                value={cloneSourceSectionId ?? ''}
                onValueChange={(val) => {
                  setCloneSourceSectionId(val);
                  setCloneSourceCoverId(null);
                  setCloneSourceProgramId(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Step 2: Source Cover (only covers WITH programs, excluding current) */}
            {cloneSourceSectionId &&
              (() => {
                const coversWithPrograms = (
                  sections.find((s) => s.id === cloneSourceSectionId)?.covers ?? []
                ).filter(
                  (c) => c.id !== effectiveCoverId && (programsByCover[c.id]?.length ?? 0) > 0,
                );
                return (
                  <div className="space-y-1.5">
                    <Label>Source Cover</Label>
                    {coversWithPrograms.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No covers with programs in this section.
                      </p>
                    ) : (
                      <Select
                        value={cloneSourceCoverId ?? ''}
                        onValueChange={(val) => {
                          setCloneSourceCoverId(val);
                          setCloneSourceProgramId(null);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select cover" />
                        </SelectTrigger>
                        <SelectContent>
                          {coversWithPrograms.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                );
              })()}

            {/* Step 3: Source Program */}
            {cloneSourceCoverId &&
              (() => {
                const sourcePrograms = programsByCover[cloneSourceCoverId] ?? [];
                return (
                  <div className="space-y-1.5">
                    <Label>Source Program</Label>
                    {sourcePrograms.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No programs available.</p>
                    ) : sourcePrograms.length === 1 ? (
                      (() => {
                        if (!cloneSourceProgramId && sourcePrograms[0]?.id) {
                          setTimeout(() => setCloneSourceProgramId(sourcePrograms[0].id), 0);
                        }
                        return (
                          <p className="text-sm font-medium">
                            {sourcePrograms[0].treatyName || 'Unnamed program'}
                          </p>
                        );
                      })()
                    ) : (
                      <Select
                        value={cloneSourceProgramId ?? ''}
                        onValueChange={setCloneSourceProgramId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select program" />
                        </SelectTrigger>
                        <SelectContent>
                          {sourcePrograms.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.treatyName || 'Unnamed program'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                );
              })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloneFromDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!cloneSourceProgramId || isCloneFromLoading}
              onClick={async () => {
                if (!cloneSourceProgramId || !effectiveCoverId || !effectiveOrgId) return;
                const sourceProgram = (programsByCover[cloneSourceCoverId!] ?? []).find(
                  (p) => p.id === cloneSourceProgramId,
                );
                if (!sourceProgram) return;

                setIsCloneFromLoading(true);
                try {
                  const sourceTreaties =
                    await listReinsuranceTreatiesByProgram(cloneSourceProgramId);

                  const payload = buildCreateProgramPayload(
                    sourceProgram,
                    effectiveCoverId,
                    effectiveOrgId,
                    productId,
                  );
                  console.log(
                    '[CloneFrom] creating program with payload:',
                    JSON.stringify(payload, null, 2),
                  );
                  const newProgram = await createReinsuranceProgram(payload);

                  let count = 0;
                  for (const treaty of sourceTreaties) {
                    await cloneReinsuranceTreaty(treaty.id, newProgram.id);
                    count++;
                  }

                  const refreshed = isMultiCover
                    ? await listReinsuranceProgramsByCover(effectiveCoverId)
                    : await listReinsuranceProgramsByCover(undefined, productId);
                  setProgramsByCover((prev) => ({ ...prev, [effectiveCoverId]: refreshed }));

                  toast({
                    title: 'Program cloned',
                    description: `Program "${sourceProgram.treatyName}" with ${count} treaty structure(s) cloned to this cover.`,
                  });
                  setCloneFromDialogOpen(false);
                  setCloneSourceSectionId(null);
                  setCloneSourceCoverId(null);
                  setCloneSourceProgramId(null);
                } catch (err: unknown) {
                  console.error('[CloneFrom] error:', err);
                  const msg =
                    (err as { response?: { data?: { message?: string | string[] } } })?.response
                      ?.data?.message ??
                    (err as Error)?.message ??
                    'Could not clone program from the source cover.';
                  toast({
                    title: 'Clone failed',
                    description: Array.isArray(msg) ? msg.join(', ') : String(msg),
                    variant: 'destructive',
                  });
                } finally {
                  setIsCloneFromLoading(false);
                }
              }}
              className="gap-2"
            >
              {isCloneFromLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isCloneFromLoading ? 'Cloning…' : 'Clone Program'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* ── Save & Exit / Discard & Exit Dialog ── */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            You have unsaved changes. Would you like to save before leaving?
          </p>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowExitDialog(false);
                navigate(-1);
              }}
            >
              Discard &amp; Exit
            </Button>
            <Button
              disabled={isSavingAndExiting}
              onClick={async () => {
                setIsSavingAndExiting(true);
                try {
                  await handleCreateProgram();
                  setShowExitDialog(false);
                  navigate(-1);
                } catch {
                  // handleCreateProgram already shows toast on error
                } finally {
                  setIsSavingAndExiting(false);
                }
              }}
            >
              {isSavingAndExiting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                'Save & Exit'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CoverReinsuranceSetup;
