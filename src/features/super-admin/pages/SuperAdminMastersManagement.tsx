import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Database, Loader2, ArrowLeft, Plus, Edit, Trash2, GripVertical } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import TableSkeleton from '@/components/loaders/TableSkeleton';
import {
  getAllGlobalMasters,
  type GlobalMasterDto,
  type GlobalMasterValueDto,
  createGlobalMasterValue,
  type CreateGlobalMasterValueRequest,
  updateGlobalMasterValue,
  deleteGlobalMasterValue,
  createGlobalMaster,
  updateGlobalMaster,
  deleteGlobalMaster,
} from '@/features/product-config/masters/api/masters';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

interface MasterValueDto {
  id: string;
  masterId: string;
  valueLabel: string;
  valueCode: string;
  parentValueId: string | null;
  sortOrder: number;
  isActive: boolean;
  metadata: Record<string, unknown> | null;
}

const SuperAdminMastersManagement = () => {
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuthStore();

  const [globalMasters, setGlobalMasters] = useState<GlobalMasterDto[]>([]);
  const [activeMasterId, setActiveMasterId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editDialogOpenId, setEditDialogOpenId] = useState<string | null>(null);
  const [newValue, setNewValue] = useState<{
    label: string;
    active: boolean;
    order?: number;
    parentValueId?: string | null;
  }>({ label: '', active: true, parentValueId: null });
  const [editingValue, setEditingValue] = useState<{
    id: string;
    label: string;
    active: boolean;
    order?: number;
    parentValueId?: string | null;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateMasterDialogOpen, setIsCreateMasterDialogOpen] = useState(false);
  const [newMasterData, setNewMasterData] = useState<{
    displayLabel: string;
    options: string;
    parentMasterId?: string | null;
  }>({ displayLabel: '', options: '', parentMasterId: null });
  const [isCreatingMaster, setIsCreatingMaster] = useState(false);
  const [editMasterDialogId, setEditMasterDialogId] = useState<string | null>(null);
  const [editMasterData, setEditMasterData] = useState<{ displayLabel: string; description: string }>({ displayLabel: '', description: '' });
  const [isUpdatingMaster, setIsUpdatingMaster] = useState(false);
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

  useEffect(() => {
    const loadGlobalMastersData = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const data = await getAllGlobalMasters();
        setGlobalMasters(data);
        if (data.length > 0) {
          setActiveMasterId(data[0].id);
        }
      } catch (error: any) {
        console.error('Failed to load global masters', error);

        // Handle auth errors gracefully without triggering global logout
        const status = error?.status;
        if (status === 401 || status === 403) {
          setLoadError(
            'Unable to load global masters. The backend endpoint may not be available or your account may not have the required permissions.',
          );
          toast({
            title: 'Access Denied',
            description: 'Unable to load global masters. Please check backend configuration.',
            variant: 'destructive',
          });
        } else {
          const errorMsg = error?.message || 'Failed to load global masters.';
          setLoadError(errorMsg);
          toast({
            title: 'Error Loading Masters',
            description: errorMsg,
            variant: 'destructive',
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadGlobalMastersData();
  }, [toast]);

  const getActiveMaster = (): GlobalMasterDto | undefined => {
    return globalMasters.find((m) => m.id === activeMasterId);
  };

  const upsertMasterValues = (
    masterId: string,
    updater: (values: GlobalMasterValueDto[]) => GlobalMasterValueDto[],
  ) => {
    setGlobalMasters((prev) =>
      prev.map((m) => (m.id === masterId ? { ...m, values: updater(m.values || []) } : m)),
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
      const order = Math.max(1, newValue.order ?? values.length + 1);

      const payload: CreateGlobalMasterValueRequest = {
        globalMasterId: master.id,
        valueLabel: newValue.label.trim(),
        valueCode: newValue.label.trim(),
        parentValueId: newValue.parentValueId || null,
        sortOrder: order,
        status: newValue.active ? 'active' : 'inactive',
        metadata: null,
      };
      const created = await createGlobalMasterValue(payload);
      upsertMasterValues(master.id, (v) => [...v, created]);

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

      const payload = {
        valueLabel: editingValue.label.trim(),
        valueCode: editingValue.label.trim(),
        parentValueId: editingValue.parentValueId || null,
        sortOrder: editingValue.order ?? 1,
        status: editingValue.active ? 'active' : 'inactive',
      };
      const updated = await updateGlobalMasterValue(editingValue.id, payload);
      upsertMasterValues(master.id, (v) =>
        v.map((item) => (item.id === updated.id ? updated : item)),
      );

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
          await deleteGlobalMasterValue(id);
          upsertMasterValues(master.id, (v) => v.filter((item) => item.id !== id));
          toast({ title: 'Success', description: 'Item has been deleted successfully' });
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
      const master = getActiveMaster();
      if (!master) return;

      const items = [...(master.values || [])].sort(
        (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
      );
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over?.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const newItems = arrayMove(items, oldIndex, newIndex);
      const mappedNewItems = newItems.map((item, index) => ({ ...item, sortOrder: index }));

      // Optimistic update
      upsertMasterValues(master.id, () => mappedNewItems);

      try {
        const itemsToUpdate = mappedNewItems.filter((item) => {
          const original = items.find((i) => i.id === item.id);
          return original && original.sortOrder !== item.sortOrder;
        });

        if (itemsToUpdate.length > 0) {
          await Promise.all(
            itemsToUpdate.map((update) =>
              updateGlobalMasterValue(update.id, {
                valueLabel: update.valueLabel,
                valueCode: update.valueCode,
                parentValueId: update.parentValueId,
                sortOrder: update.sortOrder,
                status: update.status,
              })
            )
          );
          toast({ title: 'Success', description: 'Order updated successfully' });
        }
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to update order',
          variant: 'destructive',
        });
        // Reload to revert changes
        const data = await getAllGlobalMasters();
        setGlobalMasters(data);
      }
    }
  };

  const handleCreateMaster = async () => {
    if (!newMasterData.displayLabel) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in the display label.',
        variant: 'destructive',
      });
      return;
    }

    if (!newMasterData.options || newMasterData.options.trim().length === 0) {
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
      const order = globalMasters.length + 1;
      const payload = {
        displayLabel: newMasterData.displayLabel,
        masterKey,
        order,
        options: newMasterData.options,
        parentMasterId: newMasterData.parentMasterId || undefined,
        isHierarchical: !!newMasterData.parentMasterId,
      };

      await createGlobalMaster(payload);
      toast({
        title: 'Success',
        description: 'Global master created successfully.',
      });
      // Reload global masters
      const data = await getAllGlobalMasters();
      setGlobalMasters(data);
      if (data.length > 0) {
        setActiveMasterId(data[data.length - 1].id);
      }

      setIsCreateMasterDialogOpen(false);
      setNewMasterData({ displayLabel: '', options: '', parentMasterId: null });
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

  const handleDeleteMaster = (master: GlobalMasterDto) => {
    showConfirmDialog(
      {
        title: 'Delete Master',
        description: `Are you sure you want to delete the "${master.displayLabel || master.masterKey}" master and all its values? This action cannot be undone.`,
        confirmText: 'Delete',
        variant: 'destructive',
      },
      async () => {
        try {
          await deleteGlobalMaster(master.id);
          setGlobalMasters((prev) => {
            const remaining = prev.filter((m) => m.id !== master.id);
            // If the deleted master was the active one, switch to the first remaining
            if (activeMasterId === master.id) {
              setActiveMasterId(remaining[0]?.id || '');
            }
            return remaining;
          });
          toast({ title: 'Success', description: `"${master.displayLabel || master.masterKey}" has been deleted.` });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Delete failed';
          toast({ title: 'Delete failed', description: msg, variant: 'destructive' });
        }
      },
    );
  };

  const handleUpdateMaster = async () => {
    if (!editMasterDialogId || !editMasterData.displayLabel.trim()) {
      toast({ title: 'Validation Error', description: 'Display Label is required.', variant: 'destructive' });
      return;
    }
    setIsUpdatingMaster(true);
    try {
      const updated = await updateGlobalMaster(editMasterDialogId, {
        displayLabel: editMasterData.displayLabel.trim(),
        description: editMasterData.description.trim() || undefined,
      });
      setGlobalMasters((prev) =>
        prev.map((m) => m.id === editMasterDialogId ? { ...m, displayLabel: updated.displayLabel, description: updated.description } : m)
      );
      toast({ title: 'Success', description: 'Master updated successfully.' });
      setEditMasterDialogId(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Update failed';
      toast({ title: 'Update failed', description: msg, variant: 'destructive' });
    } finally {
      setIsUpdatingMaster(false);
    }
  };

  const renderMasterTable = (master: GlobalMasterDto) => {
    const parentMaster = master.parentMasterId
      ? globalMasters.find((m) => m.id === master.parentMasterId)
      : null;

    const getParentValueLabel = (parentValueId: string | null) => {
      if (!parentMaster || !parentValueId) return '-';
      const parentValue = parentMaster.values?.find((v) => v.id === parentValueId);
      return parentValue ? parentValue.valueLabel : '-';
    };

    const items = [...(master.values || [])].sort((a, b) => {
      if (parentMaster) {
        const parentLabelA = getParentValueLabel(a.parentValueId) || '';
        const parentLabelB = getParentValueLabel(b.parentValueId) || '';
        const parentCompare = parentLabelA.localeCompare(parentLabelB);
        if (parentCompare !== 0) return parentCompare;
      }
      return (a.sortOrder || 0) - (b.sortOrder || 0);
    });

    return (
      <Card className="flex flex-col h-full min-h-0">
        <CardHeader className="shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                {master.displayLabel?.trim() || master.masterKey}
              </CardTitle>
              <CardDescription>
                {master.description?.trim() || `Manage values for ${master.displayLabel?.trim() || master.masterKey}`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
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
                            setNewValue({ ...newValue, parentValueId: val === 'null' ? null : val })
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
                        placeholder="e.g., USD - US Dollar"
                      />
                    </div>
                    {/* Order field removed */}
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="active"
                        checked={newValue.active}
                        onChange={(e) => setNewValue({ ...newValue, active: e.target.checked })}
                        className="h-4 w-4 rounded border border-input bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      />
                      <Label htmlFor="active">Active</Label>
                    </div>
                  </div>
                  <DialogFooter>
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
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-y-auto overflow-x-auto custom-scrollbars flex-1 min-h-0 p-0 sm:p-6 sm:pt-0 pb-16">
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
                <TableHead className="text-center w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!parentMaster ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={items} strategy={verticalListSortingStrategy}>
                    {items.map((item) => (
                      <SortableRow key={item.id} id={item.id}>
                        {(attributes, listeners) => (
                          <>
                            <TableCell>
                              <div
                                {...attributes}
                                {...listeners}
                                className="cursor-grab hover:text-primary"
                              >
                                <GripVertical className="h-4 w-4" />
                              </div>
                            </TableCell>
                            <TableCell>{item.valueLabel}</TableCell>
                            <TableCell>
                              <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                                {item.status === 'active' ? 'Active' : 'Inactive'}
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
                                          active: item.status === 'active',
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
                                              setEditingValue({
                                                ...editingValue,
                                                label: e.target.value,
                                              })
                                            }
                                          />
                                        </div>
                                        {/* Order field removed */}
                                        <div className="flex items-center space-x-2">
                                          <input
                                            type="checkbox"
                                            id="edit-active"
                                            checked={editingValue.active}
                                            onChange={(e) =>
                                              setEditingValue({
                                                ...editingValue,
                                                active: e.target.checked,
                                              })
                                            }
                                            className="h-4 w-4 rounded border border-input bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                          />
                                          <Label htmlFor="edit-active">Active</Label>
                                        </div>
                                      </div>
                                    )}
                                    <DialogFooter>
                                      <Button onClick={handleUpdateItem} disabled={isSaving}>
                                        {isSaving ? (
                                          <span className="inline-flex items-center">
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                          </span>
                                        ) : (
                                          'Update'
                                        )}
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
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
                      <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                        {item.status === 'active' ? 'Active' : 'Inactive'}
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
                                  active: item.status === 'active',
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
                                      setEditingValue({
                                        ...editingValue,
                                        label: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id="edit-active"
                                    checked={editingValue.active}
                                    onChange={(e) =>
                                      setEditingValue({
                                        ...editingValue,
                                        active: e.target.checked,
                                      })
                                    }
                                    className="h-4 w-4 rounded border border-input bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                  />
                                  <Label htmlFor="edit-active">Active</Label>
                                </div>
                              </div>
                            )}
                            <DialogFooter>
                              <Button onClick={handleUpdateItem} disabled={isSaving}>
                                {isSaving ? (
                                  <span className="inline-flex items-center">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                  </span>
                                ) : (
                                  'Update'
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  // Route is already protected by RequireAuth wrapper in App.tsx, no need for additional role check

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background p-6">
      <div className="w-full shrink-0 mb-6">
        {/* Header */}
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">Global Masters Management</h1>
              <p className="text-muted-foreground">
                Manage currency, product category, and other global masters
              </p>
            </div>
            <Dialog open={isCreateMasterDialogOpen} onOpenChange={setIsCreateMasterDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create New Master
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] bg-white">
                <DialogHeader>
                  <DialogTitle>Create New Global Master</DialogTitle>
                  <DialogDescription>Add a new master data type</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="master-label">Display Label *</Label>
                    <Input
                      id="master-label"
                      value={newMasterData.displayLabel}
                      onChange={(e) =>
                        setNewMasterData({ ...newMasterData, displayLabel: e.target.value })
                      }
                      placeholder="e.g., Currency, Product Category"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="master-options">Options (comma separated) *</Label>
                    <Input
                      id="master-options"
                      value={newMasterData.options}
                      onChange={(e) =>
                        setNewMasterData({ ...newMasterData, options: e.target.value })
                      }
                      placeholder="e.g., USD, EUR, GBP"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="parent-master">Parent Master (optional)</Label>
                    <Select
                      value={newMasterData.parentMasterId || ''}
                      onValueChange={(val) =>
                        setNewMasterData({
                          ...newMasterData,
                          parentMasterId: val === 'null' ? null : val,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent master" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="null">None</SelectItem>
                        {globalMasters.map((gm) => (
                          <SelectItem key={gm.id} value={gm.id}>
                            {gm.displayLabel}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateMaster} disabled={isCreatingMaster}>
                    {isCreatingMaster ? (
                      <span className="inline-flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </span>
                    ) : (
                      'Create Master'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loadError && (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{loadError}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <TableSkeleton rows={5} cols={4} />
          ) : (
            <div className="flex gap-6 flex-1 min-h-0">
              {/* Sidebar with master types */}
              <div className="w-72 shrink-0 flex flex-col min-h-0">
                <Card className="flex flex-col h-full min-h-0">
                  <CardHeader className="shrink-0">
                    <CardTitle className="text-sm">Master Types</CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 overflow-y-auto overflow-x-hidden custom-scrollbars flex-1 min-h-0 pb-16">
                    <div className="space-y-1">
                      {globalMasters.map((master) => (
                        <div key={master.id} className="flex items-center gap-1 group min-w-0">
                          <Button
                            variant={activeMasterId === master.id ? 'secondary' : 'ghost'}
                            className="flex-1 min-w-0 justify-start text-left"
                            onClick={() => setActiveMasterId(master.id)}
                          >
                            <Database className="w-4 h-4 mr-2 shrink-0" />
                            <span className="truncate">{master.displayLabel || master.masterKey}</span>
                          </Button>
                          {/* Edit Master Button + Dialog */}
                          <Dialog
                            open={editMasterDialogId === master.id}
                            onOpenChange={(open) => {
                              if (open) {
                                setEditMasterData({ displayLabel: master.displayLabel || '', description: master.description || '' });
                                setEditMasterDialogId(master.id);
                              } else {
                                setEditMasterDialogId(null);
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors px-0.5"
                                onClick={(e) => e.stopPropagation()}
                                title={`Edit ${master.displayLabel || master.masterKey}`}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] bg-white">
                              <DialogHeader>
                                <DialogTitle>Edit Master</DialogTitle>
                                <DialogDescription>Update the display label for this master.</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="edit-master-label">Display Label *</Label>
                                  <Input
                                    id="edit-master-label"
                                    value={editMasterData.displayLabel}
                                    onChange={(e) => setEditMasterData({ ...editMasterData, displayLabel: e.target.value })}
                                    placeholder="e.g., Currency"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-master-desc">Description</Label>
                                  <Input
                                    id="edit-master-desc"
                                    value={editMasterData.description}
                                    onChange={(e) => setEditMasterData({ ...editMasterData, description: e.target.value })}
                                    placeholder="Optional description"
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setEditMasterDialogId(null)}>Cancel</Button>
                                <Button onClick={handleUpdateMaster} disabled={isUpdatingMaster}>
                                  {isUpdatingMaster ? (
                                    <span className="inline-flex items-center">
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Saving...
                                    </span>
                                  ) : 'Save Changes'}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          {/* Delete Master Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-destructive/70 hover:text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200 transition-colors px-0.5"
                            onClick={(e) => { e.stopPropagation(); handleDeleteMaster(master); }}
                            title={`Delete ${master.displayLabel || master.masterKey}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main content */}
              <div className="flex-1 flex flex-col min-h-0">
                {getActiveMaster() && renderMasterTable(getActiveMaster()!)}
              </div>
            </div>
          )}
      <ConfirmDialog />
    </div>
  );
};

export default SuperAdminMastersManagement;



