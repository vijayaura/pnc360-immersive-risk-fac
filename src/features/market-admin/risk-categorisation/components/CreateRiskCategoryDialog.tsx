import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { InsertLevelPopover } from './InsertLevelPopover';
import { generateId, getRiskLevelShade } from '../utils/riskCategorisation';
import type { RiskLevel } from '../utils/riskCategorisation';

interface CreateRiskCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, riskLevels: RiskLevel[]) => void;
  isSubmitting?: boolean;
}

export function CreateRiskCategoryDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: CreateRiskCategoryDialogProps) {
  const [name, setName] = useState('');
  const [riskLevels, setRiskLevels] = useState<RiskLevel[]>([]);
  const [discardAlertOpen, setDiscardAlertOpen] = useState(false);

  const isDirty = name.trim() !== '' || riskLevels.length > 0;

  const normalizeLevels = (levels: RiskLevel[]) =>
    levels.map((l, i) => ({ ...l, order: i }));

  const isDuplicateLevel = (label: string) =>
    riskLevels.some((l) => l.label.toLowerCase() === label.toLowerCase());

  const handleInsertLevel = (label: string) => {
    if (isDuplicateLevel(label)) {
      toast.error(`Risk level "${label}" already exists`);
      return;
    }
    setRiskLevels((prev) =>
      normalizeLevels([...prev, { id: generateId(), label, order: prev.length }]),
    );
  };

  const handleInsertLevelBefore = (label: string, index: number) => {
    if (isDuplicateLevel(label)) {
      toast.error(`Risk level "${label}" already exists`);
      return;
    }
    setRiskLevels((prev) => {
      const next = [...prev];
      next.splice(index, 0, { id: generateId(), label, order: index });
      return normalizeLevels(next);
    });
  };

  const handleRemoveLevel = (id: string) => {
    setRiskLevels((prev) =>
      normalizeLevels(prev.filter((l) => l.id !== id)),
    );
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    onSubmit(name.trim(), riskLevels);
    resetForm();
  };

  const handleCancel = () => {
    if (isDirty) {
      setDiscardAlertOpen(true);
    } else {
      resetForm();
      onOpenChange(false);
    }
  };

  const resetForm = () => {
    setName('');
    setRiskLevels([]);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) handleCancel(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Risk Category</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="rc-cat-name">Category Name</Label>
              <Input
                id="rc-cat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Standard Risk Category"
              />
            </div>

            <div className="space-y-2">
              <Label>Risk Levels</Label>
              <p className="text-xs text-muted-foreground">
                Define levels from lowest to highest risk. Order matters — first is safest.
              </p>
              <div className="flex flex-wrap items-center gap-1.5 min-h-8">
                {riskLevels.map((level, i) => (
                  <div key={level.id} className="inline-flex items-center gap-1.5">
                    <InsertLevelPopover
                      onInsert={(label) => handleInsertLevelBefore(label, i)}
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          title="Insert level before"
                        >
                          +
                        </Button>
                      }
                      placeholder="Enter risk level name"
                    />
                    <div
                      className={`${getRiskLevelShade(i, riskLevels.length)} inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-sm`}
                    >
                      <span>{level.label}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-70 hover:opacity-100 hover:bg-black/10"
                        onClick={() => handleRemoveLevel(level.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {riskLevels.length === 0 && (
                  <span className="text-xs text-muted-foreground italic">No levels yet</span>
                )}
              </div>
              <InsertLevelPopover
                onInsert={handleInsertLevel}
                trigger={
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-muted-foreground"
                  >
                    + Add level
                  </Button>
                }
                placeholder="Enter risk level name"
              />
              {riskLevels.length === 0 && (
                <p className="text-xs text-destructive">At least one risk level is required.</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!name.trim() || riskLevels.length === 0 || isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={discardAlertOpen} onOpenChange={setDiscardAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to discard them?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                resetForm();
                setDiscardAlertOpen(false);
                onOpenChange(false);
              }}
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
