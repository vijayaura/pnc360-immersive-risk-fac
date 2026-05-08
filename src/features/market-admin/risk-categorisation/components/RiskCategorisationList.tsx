import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Edit, Plus, Layers, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { toast } from '@/components/ui/sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  useRiskCategorisations,
  useCreateRiskCategorisation,
  useDeleteRiskCategorisation,
} from '../api/riskCategorisation';

export function RiskCategorisationList() {
  const navigate = useNavigate();
  const { data: rcs, isLoading } = useRiskCategorisations();
  const createMutation = useCreateRiskCategorisation();
  const deleteMutation = useDeleteRiskCategorisation();

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    const isDuplicateName = rcs?.some(
      (r) => r.name.toLowerCase() === name.toLowerCase(),
    );
    if (isDuplicateName) {
      toast.error(`Risk Categorisation "${name}" already exists`);
      return;
    }
    try {
      const rc = await createMutation.mutateAsync({
        name,
        titleLabelNames: [],
        levelValues: [],
      });
      setCreateOpen(false);
      setNewName('');
      toast.success('Risk Categorisation created');
      navigate(`/market-admin/risk-categorisation?id=${rc.id}`);
    } catch {
      toast.error('Failed to create Risk Categorisation');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteMutation.mutateAsync(deletingId);
      setDeletingId(null);
      toast.success('Risk Categorisation deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const deletingRc = rcs?.find((r) => r.id === deletingId);

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Risk Categorisations</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Define hierarchical master value taxonomies mapped to named risk levels.
            </p>
          </div>
          <Button className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" />
            New Risk Categorisation
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !rcs || rcs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Layers className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              No Risk Categorisations yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Create one to get started with risk taxonomy management.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>
                  <div className="text-center w-[120px]">Risk Categories</div>
                </TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rcs.map((rc) => (
                <TableRow key={rc.id}>
                  <TableCell className="font-medium">{rc.name}</TableCell>
                  <TableCell>
                    <div className="text-center text-muted-foreground w-[120px]">
                      {rc.riskCategories?.length ?? 0}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:bg-primary hover:text-white transition-colors"
                        onClick={() => navigate(`/market-admin/risk-categorisation?id=${rc.id}`)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingId(rc.id)}
                        className="h-8 w-8 text-muted-foreground hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200 hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => {
        setCreateOpen(open);
        if (!open) setNewName('');
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New Risk Categorisation</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="rc-name">Name</Label>
            <Input
              id="rc-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Construction Risk Matrix"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); setNewName(''); }}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newName.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog
        open={!!deletingId}
        onOpenChange={(v) => {
          if (!v && !deleteMutation.isPending) setDeletingId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Risk Categorisation?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingRc?.name}"? All categories, risk levels, and
              assignments will be permanently removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}


