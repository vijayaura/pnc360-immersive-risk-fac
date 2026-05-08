import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Database, Loader2, ArrowLeft, Plus, Edit, Trash2, FileText, Upload, GripVertical } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import TableSkeleton from '@/components/loaders/TableSkeleton';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  getProductMasters,
  type ProductMasterDto,
  type ProductMasterResponseDto,
  createProductMasterValue,
  type CreateProductMasterValueRequest,
  updateProductMasterValue,
  type UpdateProductMasterValueRequest,
  deleteProductMasterValue,
  fetchMasterRequiredDocs,
  DocumentTypeItem,
  addNewMasterDocumentType,
  updateMasterRequiredDoc,
  deleteMasterRequiredDoc,
  getAllGlobalMasters,
  type GlobalMasterDto,
  type GlobalMasterValueDto,
  createProductMaster,
  createGlobalMasterValue,
  type CreateGlobalMasterValueRequest,
  updateGlobalMasterValue,
  deleteGlobalMasterValue,
  createGlobalMaster,
  type CreateGlobalMasterRequest,
  updateGlobalMaster,
  deleteGlobalMaster,
  type ProductMasterValueDto,
  downloadProductMasterTemplate,
  uploadProductMasterTemplate,
  getAvailableGlobalMasters,
  importGlobalMaster,
  type AvailableGlobalMasterDto,
} from '@/features/product-config/masters/api/masters';
import {
  saveProductRequiredDocument,
  updateProductRequiredDocument,
  deleteProductRequiredDocument,
  type ProductRequiredDocumentItem,
} from '@/features/insurers/api/insurers';
import { getProduct, type Product } from '@/features/product-config/api/products';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/shared/hooks/use-toast';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import { useAuthStore } from '@/shared/stores/useAuthStore';

interface SortableRowProps {
  id: string;
  children: (attributes: any, listeners: any) => React.ReactNode;
}

const SortableRow = ({ id, children }: SortableRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
    position: 'relative' as React.CSSProperties['position'],
  };

  return (
    <TableRow ref={setNodeRef} style={style} data-id={id}>
      {children(attributes, listeners)}
    </TableRow>
  );
};

const ProductMastersManagement = () => {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const { isSuperAdmin } = useAuthStore();

  const [masters, setMasters] = useState<ProductMasterDto[]>([]);
  const [globalMasters, setGlobalMasters] = useState<ProductMasterDto[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [activeMasterId, setActiveMasterId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isLoadingRequiredDocs, setIsLoadingRequiredDocs] = useState(false);
  const [requiredDocsError, setRequiredDocsError] = useState<string | null>(null);
  const [requiredDocuments, setRequiredDocuments] = useState([]);
  const requiredDocsApiRef = useRef(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editDialogOpenId, setEditDialogOpenId] = useState<string | null>(null);
  const [newValue, setNewValue] = useState<{
    label: string;
    active: boolean;
    order?: number;
    description?: string;
    required?: boolean;
    parentValueId?: string | null;
  }>({ label: '', active: true, parentValueId: null });
  const [editingValue, setEditingValue] = useState<{
    id: string;
    label: string;
    active: boolean;
    order?: number;
    description?: string;
    required?: boolean;
    parentValueId?: string | null;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateMasterDialogOpen, setIsCreateMasterDialogOpen] = useState(false);
  const [isUploadMasterOpen, setIsUploadMasterOpen] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [newMasterData, setNewMasterData] = useState<{
    displayLabel: string;
    options: string;
    isGlobal: boolean;
    parentMasterId?: string | null;
    hierarchicalOptions: Record<string, string>;
  }>({
    displayLabel: '',
    options: '',
    isGlobal: false,
    parentMasterId: null,
    hierarchicalOptions: {},
  });
  const [isCreatingMaster, setIsCreatingMaster] = useState(false);
  const [editingMaster, setEditingMaster] = useState<{
    id: string;
    displayLabel: string;
    isGlobal: boolean;
  } | null>(null);
  const [isEditMasterDialogOpen, setIsEditMasterDialogOpen] = useState(false);
  // Global Master Import states
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [availableGlobalMastersForImport, setAvailableGlobalMastersForImport] = useState<
    AvailableGlobalMasterDto[]
  >([]);
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const toSlug = (str: string) => {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/(^-|-$)/g, '');
  };

  const handleCreateMaster = async () => {
    if (!product?.id) return;

    // Validate: Display label is required
    if (!newMasterData.displayLabel) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in the display label.',
        variant: 'destructive',
      });
      return;
    }

    // Validate: Either options or hierarchical options required
    const hasOptions = newMasterData.options && newMasterData.options.trim().length > 0;
    const hasHierarchical =
      newMasterData.parentMasterId && Object.keys(newMasterData.hierarchicalOptions).length > 0;

    if (!hasOptions && !hasHierarchical) {
      toast({
        title: 'Validation Error',
        description: 'Please provide options.',
        variant: 'destructive',
      });
      return;
    }

    setIsCreatingMaster(true);
    try {
      const masterKey = toSlug(newMasterData.displayLabel);
      const order = masters.length + 1;
      const payload = {
        displayLabel: newMasterData.displayLabel,
        masterKey,
        order,
        options: newMasterData.options,
        hierarchicalOptions: newMasterData.parentMasterId
          ? newMasterData.hierarchicalOptions
          : undefined,
        parentMasterId: newMasterData.parentMasterId || undefined,
        isHierarchical: !!newMasterData.parentMasterId,
      };

      if (newMasterData.isGlobal) {
        await createGlobalMaster(payload);
        toast({
          title: 'Success',
          description: 'Global master created successfully.',
        });
        // Reload global masters
        window.location.reload();
      } else {
        await createProductMaster(product.id, payload);
        toast({
          title: 'Success',
          description: 'Product master created successfully.',
        });
        // Reload product masters
        const resp = await getProductMasters(product.id);
        setMasters(resp?.masters || []);
      }

      setIsCreateMasterDialogOpen(false);
      setNewMasterData({
        displayLabel: '',
        options: '',
        isGlobal: false,
        parentMasterId: null,
        hierarchicalOptions: {},
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to create master.';
      toast({
        title: 'Error',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setIsCreatingMaster(false);
    }
  };

  // --- Import from Global Master Handlers ---
  const loadAvailableGlobalMasters = useCallback(async () => {
    if (!productId) return;
    setIsLoadingAvailable(true);
    try {
      const available = await getAvailableGlobalMasters(productId);
      setAvailableGlobalMastersForImport(available);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load available Global Masters',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingAvailable(false);
    }
  }, [productId, toast]);

  const handleOpenImportDialog = useCallback(() => {
    setIsImportDialogOpen(true);
    loadAvailableGlobalMasters();
  }, [loadAvailableGlobalMasters]);

  const handleImportGlobalMaster = async (globalMasterId: string, displayLabel: string) => {
    if (!productId) return;
    setIsImporting(true);
    try {
      const result = await importGlobalMaster(productId, globalMasterId);
      toast({
        title: 'Import Successful',
        description: `Imported "${displayLabel}" with ${result.valuesCreated} values. Master key: ${result.productMaster.masterKey}`,
      });
      setIsImportDialogOpen(false);
      await reloadMasters();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Import failed';
      toast({
        title: 'Import Failed',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const DOCUMENTS_KEY = 'document-types';
  const getOrderedDocuments = useCallback((docs: any[]) => {
    return (Array.isArray(docs) ? docs : []).map((doc, index) => ({
      ...doc,
      order: index + 1,
    }));
  }, []);

  const loadProductDocuments = useCallback(async () => {
    if (!product?.id) return;
    if (requiredDocsApiRef.current) return;
    requiredDocsApiRef.current = true;
    setIsLoadingRequiredDocs(true);
    setRequiredDocsError(null);
    try {
      const docs = await fetchMasterRequiredDocs(product.id);
      setRequiredDocuments(getOrderedDocuments(docs));
    } catch (err) {
      const error = err as { status?: number; message?: string };
      const status = error.status;
      const message = error.message;
      if (status === 400)
        setRequiredDocsError(message || 'Bad request while loading required documents.');
      else if (status === 401) setRequiredDocsError('Unauthorized. Please log in again.');
      else if (status === 403) setRequiredDocsError("You don't have access to required documents.");
      else if (status && status >= 500)
        setRequiredDocsError('Server error. Please try again later.');
      else setRequiredDocsError(message || 'Failed to load required documents.');
    } finally {
      setIsLoadingRequiredDocs(false);
      requiredDocsApiRef.current = false;
    }
  }, [product, getOrderedDocuments]);

  useEffect(() => {
    const loadMasters = async () => {
      if (!productId) {
        setLoadError('Product ID is required');
        return;
      }
      setIsLoading(true);
      setLoadError(null);
      try {
        const resp: ProductMasterResponseDto = await getProductMasters(productId);
        const list = resp?.masters || [];
        setMasters(list);
        if (list.length > 0) {
          setActiveMasterId(list[0].masterId);
        } else {
          setActiveMasterId(DOCUMENTS_KEY);
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to load product masters';
        setLoadError(msg);
      } finally {
        setIsLoading(false);
      }
    };
    loadMasters();
  }, [productId]);

  const reloadMasters = async () => {
    if (!productId) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const resp: ProductMasterResponseDto = await getProductMasters(productId);
      const list = resp?.masters || [];
      setMasters(list);
      setActiveMasterId(list[0]?.masterId || '');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load product masters';
      setLoadError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) return;
      try {
        const p = await getProduct(productId);
        setProduct(p || null);
      } catch (e) {
        setProduct(null);
      }
    };
    loadProduct();
  }, [productId]);

  useEffect(() => {
    loadProductDocuments();
  }, [productId, loadProductDocuments]);

  useEffect(() => {
    const loadGlobalMastersData = async () => {
      try {
        const data = await getAllGlobalMasters();

        const mapValues = (
          items: GlobalMasterValueDto[] = [],
          masterKey: string,
        ): ProductMasterValueDto[] => {
          return items.map((item) => ({
            id: String(item.id),
            masterId: masterKey,
            valueLabel: item.valueLabel,
            valueCode: item.valueCode,
            parentValueId: item.parentValueId || null,
            sortOrder: item.sortOrder || 0,
            isActive: item.status === 'active',
            metadata: item.metadata || null,
            createdById: '',
            updatedById: '',
            createdAt: '',
            updatedAt: '',
          }));
        };

        const newGlobalMasters: ProductMasterDto[] = data.map((gm) => ({
          masterId: gm.id,
          masterKey: gm.masterKey,
          displayLabel: gm.displayLabel,
          parentMasterId: gm.parentMasterId,
          values: mapValues(gm.values, gm.masterKey),
        }));

        const priorityKeys = [
          'country',
          'countries',
          'region',
          'regions',
          'zone',
          'zones',
          'project_type',
          'project_types',
          'sub_project_type',
          'sub_project_types',
          'construction_type',
          'construction_types',
          'role_type',
          'role_types',
          'contract_type',
          'contract_types',
          'soil_type',
          'soil_types',
          'subcontractor_type',
          'subcontractor_types',
          'consultant_role',
          'consultant_roles',
          'security_type',
          'security_types',
          'area_type',
          'area_types',
          'document_type',
          'document_types',
        ];

        newGlobalMasters.sort((a, b) => {
          const idxA = priorityKeys.indexOf(a.masterKey);
          const idxB = priorityKeys.indexOf(b.masterKey);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return 0;
        });

        setGlobalMasters(newGlobalMasters);
      } catch (error) {
        console.error('Failed to load global masters', error);
      }
    };
    loadGlobalMastersData();
  }, []);

  const getActiveMaster = (): ProductMasterDto | undefined => {
    const productMaster = masters.find((m) => m.masterId === activeMasterId);
    if (productMaster) return productMaster;
    return globalMasters.find((m) => m.masterId === activeMasterId);
  };

  const upsertMasterValues = (
    masterId: string,
    updater: (
      values: NonNullable<ProductMasterDto['values']>,
    ) => NonNullable<ProductMasterDto['values']>,
  ) => {
    setMasters((prev) =>
      prev.map((m) => (m.masterId === masterId ? { ...m, values: updater(m.values || []) } : m)),
    );
    setGlobalMasters((prev) =>
      prev.map((m) => (m.masterId === masterId ? { ...m, values: updater(m.values || []) } : m)),
    );
  };

  const handleAddItem = async () => {
    if (!newValue.label.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in Display Label',
        variant: 'destructive',
      });
      return;
    }
    try {
      setIsCreating(true);
      const master = getActiveMaster();
      if (!master) return;
      const values = master.values || [];
      const order = newValue.order ?? values.length + 1;

      const isGlobal = globalMasters.some((gm) => gm.masterId === master.masterId);

      if (isGlobal) {
        const payload: CreateGlobalMasterValueRequest = {
          globalMasterId: master.masterId,
          valueLabel: newValue.label.trim(),
          valueCode: newValue.label.trim(),
          parentValueId: newValue.parentValueId || null,
          sortOrder: order,
          status: newValue.active ? 'active' : 'inactive',
          metadata: null,
        };
        const created = await createGlobalMasterValue(payload);
        const mappedValue: ProductMasterValueDto = {
          id: created.id,
          masterId: master.masterId,
          valueLabel: created.valueLabel,
          valueCode: created.valueCode,
          parentValueId: created.parentValueId || null,
          sortOrder: created.sortOrder,
          isActive: created.status === 'active',
          metadata: created.metadata || null,
          createdById: '',
          updatedById: '',
          createdAt: '',
          updatedAt: '',
        };
        upsertMasterValues(master.masterId, (v) => [...v, mappedValue]);
      } else {
        const payload: CreateProductMasterValueRequest = {
          masterId: master.masterId,
          valueLabel: newValue.label.trim(),
          valueCode: newValue.label.trim(),
          parentValueId: newValue.parentValueId || null,
          sortOrder: order,
          isActive: newValue.active,
          metadata: null,
        };
        const created = await createProductMasterValue(payload);
        upsertMasterValues(master.masterId, (v) => [...v, created]);
      }

      setNewValue({ label: '', active: true, parentValueId: null });
      setIsAddDialogOpen(false);
      toast({ title: 'Success', description: 'Value has been added successfully' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Create failed';
      toast({ title: 'Create failed', description: msg, variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateItem = async () => {
    if (!editingValue || !editingValue.label.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in Display Label',
        variant: 'destructive',
      });
      return;
    }
    try {
      setIsSaving(true);
      const master = getActiveMaster();
      if (!master) return;

      const isGlobal = globalMasters.some((gm) => gm.masterId === master.masterId);

      if (isGlobal) {
        const payload = {
          valueLabel: editingValue.label.trim(),
          valueCode: editingValue.label.trim(),
          parentValueId: editingValue.parentValueId || null,
          sortOrder: editingValue.order ?? 0,
          status: editingValue.active ? 'active' : 'inactive',
        };
        const updated = await updateGlobalMasterValue(editingValue.id, payload);
        const mappedValue: ProductMasterValueDto = {
          id: updated.id,
          masterId: master.masterId,
          valueLabel: updated.valueLabel,
          valueCode: updated.valueCode,
          parentValueId: updated.parentValueId || null,
          sortOrder: updated.sortOrder,
          isActive: updated.status === 'active',
          metadata: updated.metadata || null,
          createdById: '',
          updatedById: '',
          createdAt: '',
          updatedAt: '',
        };
        upsertMasterValues(master.masterId, (v) =>
          v.map((item) => (item.id === updated.id ? mappedValue : item)),
        );
      } else {
        const payload: UpdateProductMasterValueRequest = {
          valueLabel: editingValue.label.trim(),
          valueCode: editingValue.label.trim(),
          parentValueId: editingValue.parentValueId || null,
          sortOrder: editingValue.order ?? 0,
          isActive: editingValue.active,
        };
        const updated = await updateProductMasterValue(editingValue.id, payload);
        upsertMasterValues(master.masterId, (v) =>
          v.map((item) => (item.id === updated.id ? updated : item)),
        );
      }

      setEditingValue(null);
      setEditDialogOpenId(null);
      toast({ title: 'Success', description: 'Item has been updated successfully' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Update failed';
      toast({ title: 'Update failed', description: msg, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = (id: string) => {
    const master = getActiveMaster();
    if (!master) return;
    const item = (master.values || []).find((v) => v.id === id);
    const itemName = item?.valueLabel || 'Item';
    showConfirmDialog(
      {
        title: 'Delete Item',
        description: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
        confirmText: 'Delete',
        variant: 'destructive',
      },
      async () => {
        try {
          const isGlobal = globalMasters.some((gm) => gm.masterId === master.masterId);
          if (isGlobal) {
            await deleteGlobalMasterValue(id);
          } else {
            await deleteProductMasterValue(id);
          }
          upsertMasterValues(master.masterId, (v) => v.filter((item) => item.id !== id));
          toast({ title: 'Success', description: 'Item has been deleted successfully' });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Delete failed';
          toast({ title: 'Delete failed', description: msg, variant: 'destructive' });
        }
      },
    );
  };

  const handleUpdateMaster = async () => {
    if (!editingMaster || !editingMaster.displayLabel) return;
    try {
      setIsSaving(true);
      if (editingMaster.isGlobal) {
        await updateGlobalMaster(editingMaster.id, {
          displayLabel: editingMaster.displayLabel,
        });
        toast({ title: 'Success', description: 'Global master updated successfully.' });
        window.location.reload();
      } else {
        // Product master update not fully implemented in API client yet?
        // But checking product.service.ts, there isn't a direct "update product master" endpoint exposed in masters.ts either.
        // Wait, masters.ts doesn't have updateProductMaster.
        // I should skip product master update for now or implement it if critical.
        // The user asked for "global masters" provision.
        toast({ title: 'Info', description: 'Updating product master is not supported yet.' });
      }
      setIsEditMasterDialogOpen(false);
      setEditingMaster(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Update failed';
      toast({ title: 'Update failed', description: msg, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMaster = (master: ProductMasterDto) => {
    const isGlobal = globalMasters.some((gm) => gm.masterKey === master.masterKey);

    showConfirmDialog(
      {
        title: 'Delete Master',
        description: `Are you sure you want to delete "${master.displayLabel}"? This will delete all its values too.`,
        confirmText: 'Delete',
        variant: 'destructive',
      },
      async () => {
        try {
          if (isGlobal) {
            // we need the ID, not masterKey. master.masterId holds the ID based on my mapping in loadGlobalMastersData
            await deleteGlobalMaster(master.masterId);
            toast({ title: 'Success', description: 'Global master deleted successfully' });
            window.location.reload();
          } else {
            // Product master delete logic
            // masters.ts doesn't have deleteProductMaster either?
            // Checking...
            toast({ title: 'Info', description: 'Deleting product master is not supported yet.' });
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Delete failed';
          toast({ title: 'Delete failed', description: msg, variant: 'destructive' });
        }
      },
    );
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const getActiveMaster = () => {
        return [...masters, ...globalMasters].find((m) => m.masterId === activeMasterId);
      };

      const master = getActiveMaster();
      if (!master) return;

      const items = [...(master.values || [])].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over?.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const newItems = arrayMove(items, oldIndex, newIndex);

      // Define upsertMasterValues locally or use if available. 
      // It seems upsertMasterValues is defined in the component. 
      // I'll search for it or assume it's available. 
      // Actually, I should assume it's available since other functions use it.
      // But if it's defined as const, I must be after it.
      // Let's hope it's defined before Line 755.
      // If NOT, I can manually update state.

      const mappedNewItems = newItems.map((item, index) => ({ ...item, sortOrder: index }));

      // Optimistic update
      const updateState = (id: string, updater: (values: ProductMasterValueDto[]) => ProductMasterValueDto[]) => {
        // I will manually update masters and globalMasters since I don't have access to upsertMasterValues function definition location easily
        setMasters(prev => prev.map(m => m.masterId === id ? { ...m, values: updater(m.values) } : m));
        setGlobalMasters(prev => prev.map(m => m.masterId === id ? { ...m, values: updater(m.values) } : m));
      };

      updateState(master.masterId, () => mappedNewItems);

      try {
        const updates = mappedNewItems.map((item, index) => {
          // check if order changed from original
          const original = items.find(i => i.id === item.id);
          if (original && original.sortOrder !== index) {
            return item;
          }
          // Or just simply logic: we already remapped sortOrder.
          // items are sorted by sortOrder.
          // item at newIndex now has sortOrder = newIndex.
          // if original sortOrder was different, we need update.
          return item;
        });

        // Actually we should only update CHANGED items.
        // But for simplicity and robustness, updating affected ones (usually all between oldIndex and newIndex)
        // Here we just filter those where sortOrder changed.

        const itemsToUpdate = updates.filter(item => {
          const original = items.find(i => i.id === item.id);
          return original && original.sortOrder !== item.sortOrder;
        });

        if (itemsToUpdate.length > 0) {
          const isGlobal = globalMasters.some((gm) => gm.masterId === master.masterId);
          await Promise.all(itemsToUpdate.map(update => {
            if (isGlobal) {
              return updateGlobalMasterValue(update.id, {
                valueLabel: update.valueLabel,
                valueCode: update.valueCode,
                parentValueId: update.parentValueId,
                sortOrder: update.sortOrder,
                status: update.isActive ? 'active' : 'inactive'
              });
            } else {
              return updateProductMasterValue(update.id, {
                valueLabel: update.valueLabel,
                valueCode: update.valueCode,
                parentValueId: update.parentValueId,
                sortOrder: update.sortOrder,
                isActive: update.isActive
              });
            }
          }));
          toast({ title: 'Success', description: 'Order updated successfully' });
        }
      } catch (err) {
        toast({ title: 'Error', description: 'Failed to update order', variant: 'destructive' });
        window.location.reload();
      }
    }
  };

  const renderMasterTable = (master: ProductMasterDto, isReadOnly: boolean = false) => {
    // Check if it's a child master
    const parentMasterId = master.parentMasterId;
    // Search in both masters and globalMasters as parent could be in either (respecting type constraints)
    const parentMaster = parentMasterId
      ? [...masters, ...globalMasters].find((m) => m.masterId === parentMasterId)
      : null;

    const getParentValueLabel = (parentValueId: string | null) => {
      if (!parentMaster || !parentValueId) return '-';
      const parentValue = parentMaster.values.find((v) => v.id === parentValueId);
      return parentValue ? parentValue.valueLabel : '-';
    };

    const items = [...(master.values || [])].sort((a, b) => {
      if (parentMaster) {
        // Sort by Parent Label first (Alphabetical)
        const parentLabelA = getParentValueLabel(a.parentValueId) || '';
        const parentLabelB = getParentValueLabel(b.parentValueId) || '';
        const parentCompare = parentLabelA.localeCompare(parentLabelB);

        if (parentCompare !== 0) return parentCompare;
      }
      // Secondary sort (or primary if no parent): Sort Order
      return (a.sortOrder || 0) - (b.sortOrder || 0);
    });

    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                {master.displayLabel?.trim() || master.masterKey}
                {!isReadOnly && (
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        const isGlobal = globalMasters.some(
                          (gm) => gm.masterKey === master.masterKey,
                        );
                        setEditingMaster({
                          id: master.masterId,
                          displayLabel: master.displayLabel,
                          isGlobal,
                        });
                        setIsEditMasterDialogOpen(true);
                      }}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    {/* <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteMaster(master)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button> */}
                  </div>
                )}
              </CardTitle>
              <CardDescription>
                Manage values for {master.displayLabel?.trim() || master.masterKey}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {!isReadOnly && (
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add New
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] bg-white">
                    <DialogHeader>
                      <DialogTitle>
                        Add New {master.displayLabel?.trim() || master.masterKey}
                      </DialogTitle>
                      <DialogDescription>Create a new option</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      {parentMaster && (
                        <div className="space-y-2">
                          <Label>Parent {parentMaster.displayLabel}</Label>
                          <Select
                            value={newValue.parentValueId || ''}
                            onValueChange={(val) =>
                              setNewValue({
                                ...newValue,
                                parentValueId: val === 'null' ? null : val,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={`Select ${parentMaster.displayLabel}`} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="null">None</SelectItem>
                              {parentMaster.values?.map((pv) => (
                                <SelectItem key={pv.id} value={pv.id}>
                                  {pv.valueLabel}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="label">Display Label *</Label>
                        <Input
                          id="label"
                          value={newValue.label}
                          onChange={(e) => setNewValue({ ...newValue, label: e.target.value })}
                          placeholder="e.g., Monitored"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="active"
                          checked={newValue.active}
                          onCheckedChange={(checked) => setNewValue({ ...newValue, active: checked === true })}
                        />
                        <Label htmlFor="active">Active</Label>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={handleAddItem} disabled={isCreating}>
                        {isCreating ? (
                          <span className="inline-flex items-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </span>
                        ) : (
                          'Add Item'
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {parentMaster ? (
                  <TableHead>{parentMaster.displayLabel}</TableHead>
                ) : (
                  <TableHead className="w-[50px]"></TableHead>
                )}
                <TableHead>Display Label</TableHead>
                <TableHead>Status</TableHead>
                {!isReadOnly && <TableHead className="text-center">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {!parentMaster && !isReadOnly ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={items}
                    strategy={verticalListSortingStrategy}
                  >
                    {items.map((item) => (
                      <SortableRow key={item.id} id={item.id}>
                        {(attributes, listeners) => (
                          <>
                            <TableCell>
                              <div {...attributes} {...listeners} className="cursor-grab hover:text-primary">
                                <GripVertical className="h-4 w-4" />
                              </div>
                            </TableCell>
                            <TableCell>{item.valueLabel}</TableCell>
                            <TableCell>
                              <Badge variant={item.isActive ? 'default' : 'secondary'}>
                                {item.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex gap-2 justify-center">
                                <Dialog
                                  open={editDialogOpenId === item.id}
                                  onOpenChange={(o) => setEditDialogOpenId(o ? item.id : null)}
                                >
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingValue({
                                          id: item.id,
                                          label: item.valueLabel,
                                          active: item.isActive,
                                          order: item.sortOrder,
                                          parentValueId: item.parentValueId,
                                        });
                                        setEditDialogOpenId(item.id);
                                      }}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="sm:max-w-[425px] bg-white">
                                    <DialogHeader>
                                      <DialogTitle>
                                        Edit {master.displayLabel?.trim() || master.masterKey}
                                      </DialogTitle>
                                      <DialogDescription>Update the option</DialogDescription>
                                    </DialogHeader>
                                    {editingValue && (
                                      <div className="space-y-4">
                                        {parentMaster && (
                                          <div className="space-y-2">
                                            <Label>Parent {parentMaster.displayLabel}</Label>
                                            <Select
                                              value={editingValue.parentValueId || 'null'}
                                              onValueChange={(val) =>
                                                setEditingValue({
                                                  ...editingValue,
                                                  parentValueId: val === 'null' ? null : val,
                                                })
                                              }
                                            >
                                              <SelectTrigger>
                                                <SelectValue
                                                  placeholder={`Select ${parentMaster.displayLabel}`}
                                                />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="null">None</SelectItem>
                                                {parentMaster.values?.map((pv) => (
                                                  <SelectItem key={pv.id} value={pv.id}>
                                                    {pv.valueLabel}
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        )}
                                        <div className="space-y-2">
                                          <Label htmlFor="edit-label">Display Label *</Label>
                                          <Input
                                            id="edit-label"
                                            value={editingValue.label}
                                            onChange={(e) =>
                                              setEditingValue({ ...editingValue, label: e.target.value })
                                            }
                                          />
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <Checkbox
                                            id="edit-active"
                                            checked={editingValue.active}
                                            onCheckedChange={(checked) =>
                                              setEditingValue({ ...editingValue, active: checked === true })
                                            }
                                          />
                                          <Label htmlFor="edit-active">Active</Label>
                                        </div>
                                      </div>
                                    )}
                                    <div className="flex justify-end">
                                      <Button onClick={handleUpdateItem} disabled={isSaving}>
                                        {isSaving ? (
                                          <span className="inline-flex items-center">
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                          </span>
                                        ) : (
                                          'Update Master'
                                        )}
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                                  disabled={items.length <= 1}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </>
                        )}
                      </SortableRow>
                    ))}
                  </SortableContext>
                </DndContext>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    {parentMaster ? (
                      <TableCell>{getParentValueLabel(item.parentValueId)}</TableCell>
                    ) : (
                      <TableCell className="font-medium">{item.sortOrder || '-'}</TableCell>
                    )}
                    <TableCell>{item.valueLabel}</TableCell>
                    <TableCell>
                      <Badge variant={item.isActive ? 'default' : 'secondary'}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    {!isReadOnly && (
                      <TableCell className="text-center">
                        <div className="flex gap-2 justify-center">
                          <Dialog
                            open={editDialogOpenId === item.id}
                            onOpenChange={(o) => setEditDialogOpenId(o ? item.id : null)}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingValue({
                                    id: item.id,
                                    label: item.valueLabel,
                                    active: item.isActive,
                                    order: item.sortOrder,
                                    parentValueId: item.parentValueId,
                                  });
                                  setEditDialogOpenId(item.id);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] bg-white">
                              <DialogHeader>
                                <DialogTitle>
                                  Edit {master.displayLabel?.trim() || master.masterKey}
                                </DialogTitle>
                                <DialogDescription>Update the option</DialogDescription>
                              </DialogHeader>
                              {editingValue && (
                                <div className="space-y-4">
                                  {parentMaster && (
                                    <div className="space-y-2">
                                      <Label>Parent {parentMaster.displayLabel}</Label>
                                      <Select
                                        value={editingValue.parentValueId || 'null'}
                                        onValueChange={(val) =>
                                          setEditingValue({
                                            ...editingValue,
                                            parentValueId: val === 'null' ? null : val,
                                          })
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue
                                            placeholder={`Select ${parentMaster.displayLabel}`}
                                          />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="null">None</SelectItem>
                                          {parentMaster.values?.map((pv) => (
                                            <SelectItem key={pv.id} value={pv.id}>
                                              {pv.valueLabel}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  )}
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-label">Display Label *</Label>
                                    <Input
                                      id="edit-label"
                                      value={editingValue.label}
                                      onChange={(e) =>
                                        setEditingValue({ ...editingValue, label: e.target.value })
                                      }
                                    />
                                  </div>
                                  {/* Order Field Removed */}
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="edit-active"
                                      checked={editingValue.active}
                                      onCheckedChange={(checked) =>
                                        setEditingValue({ ...editingValue, active: checked === true })
                                      }
                                    />
                                    <Label htmlFor="edit-active">Active</Label>
                                  </div>
                                </div>
                              )}
                              <div className="flex justify-end">
                                <Button onClick={handleUpdateItem} disabled={isSaving}>
                                  {isSaving ? (
                                    <span className="inline-flex items-center">
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Saving...
                                    </span>
                                  ) : (
                                    'Update Master'
                                  )}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                            disabled={items.length <= 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  const handleOpenAddDocument = () => {
    setNewValue({ label: '', active: true, required: true, description: '' });
    setIsAddDialogOpen(true);
  };

  const handleAddDialogOpenChange = (open: boolean) => {
    if (!open) {
      setIsAddDialogOpen(false);
      setNewValue({ label: '', active: true, required: true, description: '' });
    } else {
      setIsAddDialogOpen(true);
    }
  };

  const handleNewDocumentLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewValue((prev) => ({ ...prev, label: e.target.value }));
  };

  const handleNewDocumentDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewValue((prev) => ({ ...prev, description: e.target.value }));
  };

  const handleNewDocumentRequiredChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewValue((prev) => ({ ...prev, required: e.target.checked }));
  };

  const handleNewDocumentActiveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewValue((prev) => ({ ...prev, active: e.target.checked }));
  };

  const handleCreateDocumentType = async () => {
    if (!product?.id) return;
    if (!newValue.label.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in Display Label',
        variant: 'destructive',
      });
      return;
    }
    try {
      setIsCreating(true);
      const created = await addNewMasterDocumentType(product.id, {
        label: newValue.label.trim(),
        description: newValue.description || '',
        isRequired: !!newValue.required,
        status: newValue.active ? 'active' : 'inactive',
      });
      setRequiredDocuments(getOrderedDocuments([...requiredDocuments, created]));
      setNewValue({ label: '', active: true, required: true, description: '' });
      setIsAddDialogOpen(false);
      toast({ title: 'Success', description: 'Document type has been added' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Create failed';
      toast({ title: 'Create failed', description: msg, variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditDialogOpenChange = (open: boolean) => {
    if (!open) {
      setEditDialogOpenId(null);
      setEditingValue(null);
    }
  };

  const handleOpenEditDocument = (event: React.MouseEvent<HTMLElement>) => {
    const row = (event.currentTarget as HTMLElement).closest('tr');
    const id = row?.getAttribute('data-id');
    if (!id) return;
    const item = requiredDocuments.find((d) => String(d.id) === id);
    if (!item) return;
    setEditingValue({
      id: String(item.id),
      label: item.label,
      active: item.active || item.status === 'active',
      order: item.order,
      description: item.description,
      required: item.required || item.isRequired,
    });
    setEditDialogOpenId(id);
  };

  const handleEditDocumentLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingValue) return;
    setEditingValue({ ...editingValue, label: e.target.value });
  };

  const handleEditDocumentDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingValue) return;
    setEditingValue({ ...editingValue, description: e.target.value });
  };

  const handleEditDocumentRequiredChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingValue) return;
    setEditingValue({ ...editingValue, required: e.target.checked });
  };

  const handleEditDocumentActiveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingValue) return;
    setEditingValue({ ...editingValue, active: e.target.checked });
  };

  const handleUpdateDocumentType = async (documentId: string) => {
    if (!documentId || !editingValue) return;
    if (!editingValue.label.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in Display Label',
        variant: 'destructive',
      });
      return;
    }
    try {
      setIsSaving(true);
      const payload = {
        label: editingValue.label.trim(),
        description: editingValue.description || '',
        status: editingValue.active ? 'active' : 'inactive',
        isRequired: !!editingValue.required,
      };
      const updated = await updateMasterRequiredDoc(documentId, payload);
      const updatedList = requiredDocuments.map((doc) => (doc.id === documentId ? updated : doc));
      setRequiredDocuments(getOrderedDocuments(updatedList));
      setEditingValue(null);
      setEditDialogOpenId(null);
      toast({ title: 'Success', description: 'Document type has been updated' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Update failed';
      toast({ title: 'Update failed', description: msg, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleDocumentActive = async (event: React.MouseEvent<HTMLElement>) => {
    if (!product?.id) return;
    const row = (event.currentTarget as HTMLElement).closest('tr');
    const id = row?.getAttribute('data-id');
    if (!id) return;
    const item = requiredDocuments.find((d) => String(d.id) === id);
    if (!item) return;
    try {
      const updated = await updateProductRequiredDocument(product.id, id, {
        is_active: !item.active,
      });
      setRequiredDocuments(getOrderedDocuments(updated));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Update failed';
      toast({ title: 'Update failed', description: msg, variant: 'destructive' });
    }
  };

  const handleDeleteDocumentType = async (event: React.MouseEvent<HTMLElement>) => {
    if (!product?.id) return;
    const row = (event.currentTarget as HTMLElement).closest('tr');
    const id = row?.getAttribute('data-id');
    if (!id) return;

    showConfirmDialog(
      {
        title: 'Delete Document Type',
        description:
          'Are you sure you want to delete this document type? This action cannot be undone.',
        confirmText: 'Delete',
        variant: 'destructive',
      },
      async () => {
        try {
          await deleteMasterRequiredDoc(id);
          const updated = requiredDocuments.filter((d) => String(d.id) !== id);
          setRequiredDocuments(updated);
          toast({ title: 'Deleted', description: 'Document type has been deleted' });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Delete failed';
          toast({ title: 'Delete failed', description: msg, variant: 'destructive' });
        }
      },
    );
  };

  const renderDocumentTable = (
    items: {
      id: string;
      label: string;
      description?: string;
      isRequired: boolean;
      status: string;
    }[],
  ) => (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Document Types
            </CardTitle>
            <CardDescription>Manage document types required for quote creation</CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={handleAddDialogOpenChange}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={handleOpenAddDocument}>
                <Plus className="w-4 h-4" />
                Add New
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px] bg-white">
              <DialogHeader>
                <DialogTitle>Add New Document Type</DialogTitle>
                <DialogDescription>Create a new document type for quote creation</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="label">Display Label *</Label>
                  <Input
                    id="label"
                    value={newValue.label}
                    onChange={handleNewDocumentLabelChange}
                    placeholder="e.g., BOQ or Cost Breakdown"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={newValue.description || ''}
                    onChange={handleNewDocumentDescriptionChange}
                    placeholder="e.g., Bill of quantities or detailed cost breakdown"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="required"
                    checked={newValue.required || false}
                    onCheckedChange={(checked) =>
                      setNewValue({ ...newValue, required: checked === true })
                    }
                  />
                  <Label htmlFor="required">Required Document</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="active"
                    checked={newValue.active || false}
                    onCheckedChange={(checked) =>
                      setNewValue({ ...newValue, active: checked === true })
                    }
                  />
                  <Label htmlFor="active">Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateDocumentType} disabled={isCreating}>
                  {isCreating ? (
                    <span className="inline-flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    'Add Document Type'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Display Label</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Required</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} data-id={item.id}>
                <TableCell>{item.label}</TableCell>
                <TableCell className="max-w-xs truncate">{item.description}</TableCell>
                <TableCell>
                  <Badge variant={item.isRequired ? 'default' : 'secondary'}>
                    {item.isRequired ? 'Required' : 'Optional'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={item.status === 'active' ? 'default' : 'secondary'}
                    className="cursor-pointer"
                    onClick={handleToggleDocumentActive}
                  >
                    {item.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex gap-2 justify-center">
                    <Dialog
                      open={editDialogOpenId === String(item.id)}
                      onOpenChange={handleEditDialogOpenChange}
                    >
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={handleOpenEditDocument}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[525px] bg-white">
                        <DialogHeader>
                          <DialogTitle>Edit Document Type</DialogTitle>
                          <DialogDescription>
                            Update the document type information
                          </DialogDescription>
                        </DialogHeader>
                        {editingValue && (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-label">Display Label *</Label>
                              <Input
                                id="edit-label"
                                value={editingValue.label}
                                onChange={handleEditDocumentLabelChange}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-description">Description</Label>
                              <Input
                                id="edit-description"
                                value={editingValue.description || ''}
                                onChange={handleEditDocumentDescriptionChange}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-order">Order</Label>
                              <Input
                                id="edit-order"
                                type="number"
                                value={editingValue.order || ''}
                                readOnly
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="edit-required"
                                checked={editingValue.required || false}
                                onCheckedChange={(checked) =>
                                  setEditingValue({ ...editingValue, required: checked === true })
                                }
                              />
                              <Label htmlFor="edit-required">Required Document</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="edit-active"
                                checked={editingValue.active}
                                onCheckedChange={(checked) =>
                                  setEditingValue({ ...editingValue, active: checked === true })
                                }
                              />
                              <Label htmlFor="edit-active">Active</Label>
                            </div>
                          </div>
                        )}
                        <DialogFooter>
                          <Button
                            onClick={() => handleUpdateDocumentType(editingValue.id)}
                            disabled={isSaving}
                          >
                            {isSaving ? (
                              <span className="inline-flex items-center">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </span>
                            ) : (
                              'Update Document Type'
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDeleteDocumentType}
                      className="text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const activeMaster = useMemo(() => getActiveMaster(), [masters, globalMasters, activeMasterId]);

  if (loadError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex flex-col cityscape-bg p-6">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
        <Button onClick={() => navigate(-1)} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const isEmptyState = !activeMasterId && masters.length === 0;
  const isDocuments = activeMasterId === DOCUMENTS_KEY;

  const renderContent = () => {
    // if (isEmptyState) {
    //   return (
    //     <Card>
    //       <CardHeader>
    //         <CardTitle className="flex items-center gap-2">
    //           <Database className="w-5 h-5" />
    //           No masters found
    //         </CardTitle>
    //         <CardDescription>
    //           No master data is configured for this product yet.
    //         </CardDescription>
    //       </CardHeader>
    //       <CardContent>
    //         <div className="flex gap-2">
    //           <Button onClick={reloadMasters}>Refresh</Button>
    //           <Button variant="outline" onClick={() => navigate(-1)}>
    //             <ArrowLeft className="h-4 w-4 mr-2" />
    //             Back
    //           </Button>
    //         </div>
    //       </CardContent>
    //     </Card>
    //   );
    // }

    if (activeMaster) {
      // Check if it's a global master and user is not superadmin
      const isGlobal = globalMasters.some((gm) => gm.masterId === activeMaster.masterId);
      const isReadOnly = isGlobal && !isSuperAdmin();
      return renderMasterTable(activeMaster as ProductMasterDto, isReadOnly);
    }

    if (isDocuments) {
      if (isLoadingRequiredDocs) return (
        <Table>
          <TableBody>
            <TableSkeleton rowCount={6} colCount={5} />
          </TableBody>
        </Table>
      );

      if (requiredDocsError) {
        return (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{requiredDocsError}</AlertDescription>
          </Alert>
        );
      }

      return renderDocumentTable(requiredDocuments);
    }

    return null;
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await downloadProductMasterTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'product-master-template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: 'Template downloaded' });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to download template',
        variant: 'destructive',
      });
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx')) {
      toast({
        title: 'Invalid file',
        description: 'Please upload an Excel (.xlsx) file',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      if (!product?.id) throw new Error('Product ID not found');
      await uploadProductMasterTemplate(product.id, file);
      toast({
        title: 'Success',
        description: 'Masters uploaded successfully',
      });
      await reloadMasters();
      setIsUploadMasterOpen(false);
    } catch (err) {
      toast({
        title: 'Upload failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      e.target.value = '';
    }
  };

  const handleDroppedFile = (file?: File) => {
    if (!file) return;

    if (!file.name.endsWith('.xlsx')) {
      toast({
        title: 'Invalid file',
        description: 'Please upload an Excel (.xlsx) file',
        variant: 'destructive',
      });
      return;
    }

    // Reuse existing logic
    handleImportExcel({
      target: { files: [file] },
    } as unknown as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex flex-col cityscape-bg">
      <div className="flex-1 px-4 sm:px-6 py-4 sm:py-6">
        <div className="w-full max-w-[1920px] mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                className="flex-shrink-0 gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                  {product?.name ?? 'Product'} Masters
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground">
                  Manage metadata and dropdown options for{' '}
                  {(product?.name ?? '').toString() || 'this product'}
                </p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <Table>
              <TableBody>
                <TableSkeleton rowCount={8} colCount={4} />
              </TableBody>
            </Table>
          ) : (
            <div className="flex gap-4 sm:gap-6 h-[calc(100vh-10rem)]">
              <div className="w-64 sm:w-80 bg-primary/5 rounded-lg p-3 sm:p-4 overflow-y-auto flex-shrink-0">
                <div className="flex items-center justify-between mb-2 mt-2">
                  <h3 className="font-semibold text-foreground">Product Masters</h3>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-xs"
                      onClick={() => setIsUploadMasterOpen(true)}
                      title="Upload from Excel"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Upload Masters</span>
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  {masters.length &&
                    masters.map((m) => {
                      const count = (m.values || []).length;
                      return (
                        <button
                          key={m.masterKey}
                          onClick={() => setActiveMasterId(m.masterId)}
                          className={`w-full text-left p-3 rounded-lg transition-all flex items-center justify-between ${activeMasterId === m.masterId
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'hover:bg-muted/50 text-foreground'
                            }`}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <Database className="w-4 h-4" />
                            <span className="font-medium text-sm">
                              {m.displayLabel?.trim() || m.masterKey}
                            </span>
                          </div>
                          <Badge
                            variant={activeMasterId === m.masterId ? 'secondary' : 'outline'}
                            className="text-xs"
                          >
                            {count}
                          </Badge>
                        </button>
                      );
                    })}
                </div>

                {globalMasters.length > 0 && (
                  <>
                    <div className="flex items-center justify-between mb-2 mt-2">
                      <h3 className="font-semibold text-foreground">Global Masters</h3>
                    </div>
                    <div className="space-y-2 mb-4">
                      {globalMasters.map((m) => {
                        const count = (m.values || []).length;
                        return (
                          <button
                            key={m.masterKey}
                            onClick={() => setActiveMasterId(m.masterId)}
                            className={`w-full text-left p-3 rounded-lg transition-all flex items-center justify-between ${activeMasterId === m.masterId
                              ? 'bg-primary text-primary-foreground shadow-md'
                              : 'hover:bg-muted/50 text-foreground'
                              }`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <Database className="w-4 h-4" />
                              <span className="font-medium text-sm">
                                {m.displayLabel?.trim() || m.masterKey}
                              </span>
                            </div>
                            <Badge
                              variant={activeMasterId === m.masterId ? 'secondary' : 'outline'}
                              className="text-xs"
                            >
                              {count}
                            </Badge>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between mb-2 mt-2">
                  <h3 className="font-semibold text-foreground">Required Documents</h3>
                </div>
                <div className="space-y-2">
                  <button
                    key={DOCUMENTS_KEY}
                    onClick={() => setActiveMasterId(DOCUMENTS_KEY)}
                    className={`w-full text-left p-3 rounded-lg transition-all flex items-center justify-between ${activeMasterId === DOCUMENTS_KEY
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'hover:bg-muted/50 text-foreground'
                      }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Database className="w-4 h-4" />
                      <span className="font-medium text-sm">Document Types</span>
                    </div>
                    <Badge
                      variant={activeMasterId === DOCUMENTS_KEY ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {requiredDocuments.length}
                    </Badge>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2">{renderContent()}</div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isUploadMasterOpen} onOpenChange={setIsUploadMasterOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Master Data</DialogTitle>
            <DialogDescription>
              Download the Excel template, add master names and options, then upload it here.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-4">
            {/* Download template */}
            <div className="flex items-center justify-between gap-4 border rounded-md p-3">
              <div>
                <p className="font-medium text-sm">Excel Template</p>
                <p className="text-xs text-muted-foreground">
                  Use this template to define masters and options
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                Download
              </Button>
            </div>

            {/* Drag & Drop Upload */}
            <div className="grid gap-2">
              <Label>Upload filled template</Label>

              <div
                className={`
            relative flex flex-col items-center justify-center
            rounded-md border-2 border-dashed p-6 text-center
            transition-colors cursor-pointer
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted'}
          `}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragActive(true);
                }}
                onDragLeave={() => setIsDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragActive(false);
                  handleDroppedFile(e.dataTransfer.files?.[0]);
                }}
                onClick={() => document.getElementById('master-upload')?.click()}
              >
                <Input
                  id="master-upload"
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  onChange={handleImportExcel}
                />

                <p className="text-sm font-medium">
                  {isDragActive ? 'Drop the file here' : 'Drag & drop Excel file here'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  or click to browse (.xlsx only)
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUploadMasterOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateMasterDialogOpen} onOpenChange={setIsCreateMasterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Product Master</DialogTitle>
            <DialogDescription>Create a new master data list for this product.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="master-label">Display Label</Label>
              <Input
                id="master-label"
                value={newMasterData.displayLabel}
                onChange={(e) =>
                  setNewMasterData({
                    ...newMasterData,
                    displayLabel: e.target.value,
                  })
                }
                placeholder="e.g. API Softwares"
              />
            </div>
            <div className="grid gap-2">
              <Label>Parent Master (Optional)</Label>
              <Select
                value={newMasterData.parentMasterId || 'null'}
                onValueChange={(val) =>
                  setNewMasterData({
                    ...newMasterData,
                    parentMasterId: val === 'null' ? null : val,
                    hierarchicalOptions: {},
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Parent Master" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">None</SelectItem>
                  {(newMasterData.isGlobal ? globalMasters : masters)
                    .filter((m) => m.masterKey !== `${toSlug(newMasterData.displayLabel)}-dropdown`)
                    .map((gm) => (
                      <SelectItem key={gm.masterId} value={gm.masterId}>
                        {gm.displayLabel}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {newMasterData.parentMasterId ? (
              <div className="max-h-[300px] overflow-y-auto space-y-4 border p-4 rounded-md">
                <Label>Define Options per Parent Value</Label>
                {(() => {
                  const parent = (newMasterData.isGlobal ? globalMasters : masters).find(
                    (m) => m.masterId === newMasterData.parentMasterId,
                  );
                  if (!parent || !parent.values || parent.values.length === 0) {
                    return (
                      <div className="text-sm text-muted-foreground">
                        Parent master has no values.
                      </div>
                    );
                  }
                  return parent.values.map((val) => (
                    <div key={val.id} className="grid gap-2">
                      <Label className="text-xs text-muted-foreground">For: {val.valueLabel}</Label>
                      <Input
                        placeholder={`Options for ${val.valueLabel}`}
                        value={newMasterData.hierarchicalOptions[val.id] || ''}
                        onChange={(e) =>
                          setNewMasterData({
                            ...newMasterData,
                            hierarchicalOptions: {
                              ...newMasterData.hierarchicalOptions,
                              [val.id]: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  ));
                })()}
              </div>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="master-options">Options (comma separated)</Label>
                <Input
                  id="master-options"
                  value={newMasterData.options}
                  onChange={(e) =>
                    setNewMasterData({
                      ...newMasterData,
                      options: e.target.value,
                    })
                  }
                  placeholder="e.g. Postman, Api Dog, Requestly"
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-global"
                checked={newMasterData.isGlobal}
                onCheckedChange={(checked) =>
                  setNewMasterData({
                    ...newMasterData,
                    isGlobal: checked === true,
                    parentMasterId: null,
                    hierarchicalOptions: {},
                  })
                }
              />
              <Label htmlFor="is-global">Is Global Master</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateMasterDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateMaster} disabled={isCreatingMaster}>
              {isCreatingMaster && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Master
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isEditMasterDialogOpen} onOpenChange={setIsEditMasterDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle>Edit Master</DialogTitle>
            <DialogDescription>Update the master list details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-master-label">Display Label</Label>
              <Input
                id="edit-master-label"
                value={editingMaster?.displayLabel || ''}
                onChange={(e) =>
                  editingMaster &&
                  setEditingMaster({
                    ...editingMaster,
                    displayLabel: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditMasterDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateMaster} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Master
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import from Global Master Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-[550px] bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Import from Global Masters
            </DialogTitle>
            <DialogDescription>
              Select a Global Master to import into this product. Values will be copied and can be
              edited independently.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isLoadingAvailable ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : availableGlobalMastersForImport.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No Global Masters available for import.</p>
                <p className="text-sm mt-1">Contact your Super Admin to create Global Masters.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {availableGlobalMastersForImport.map((gm) => (
                  <div
                    key={gm.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${gm.alreadyImported
                      ? 'bg-muted/30 border-muted'
                      : 'bg-background hover:bg-muted/20 border-border'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Database className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{gm.displayLabel}</p>
                        <p className="text-xs text-muted-foreground">
                          {gm.valuesCount} values • Key: {gm.masterKey}
                        </p>
                      </div>
                    </div>
                    {gm.alreadyImported ? (
                      <Badge variant="secondary" className="text-xs">
                        Already Imported
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleImportGlobalMaster(gm.id, gm.displayLabel)}
                        disabled={isImporting}
                      >
                        {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Import'}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog />
    </div>
  );
};

export default ProductMastersManagement;

