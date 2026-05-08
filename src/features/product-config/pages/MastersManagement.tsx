import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Settings, Database, Building, MapPin, Shield, FileText, Percent, Globe, Loader2 } from "lucide-react";
import { useToast } from '@/shared/hooks/use-toast';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import { documentTypes } from "@/lib/masters-data";
import { listMasterProjectTypes, listMasterSubProjectTypes, listMasterConstructionTypes, listMasterRoleTypes, listMasterContractTypes, listMasterSoilTypes, listMasterSubcontractorTypes, listMasterConsultantRoles, listMasterSecurityTypes, listMasterAreaTypes, listMasterDocumentTypes, listMasterCountries, listMasterRegions, listMasterZones, createMasterProjectType, createMasterSubProjectType, createMasterConstructionType, createMasterCountry, createMasterRegion, createMasterZone, createMasterRoleType, createMasterContractType, createMasterSoilType, createMasterSubcontractorType, createMasterConsultantRole, createMasterSecurityType, createMasterAreaType, createMasterDocumentType, deleteMasterProjectType, deleteMasterSubProjectType, deleteMasterConstructionType, deleteMasterCountry, deleteMasterRegion, deleteMasterZone, deleteMasterRoleType, deleteMasterContractType, deleteMasterSoilType, deleteMasterSubcontractorType, deleteMasterConsultantRole, deleteMasterSecurityType, deleteMasterAreaType, deleteMasterDocumentType, updateMasterProjectType, updateMasterSubProjectType, updateMasterConstructionType, updateMasterCountry, updateMasterRegion, updateMasterZone, updateMasterRoleType, updateMasterContractType, updateMasterSoilType, updateMasterSubcontractorType, updateMasterConsultantRole, updateMasterSecurityType, updateMasterAreaType, updateMasterDocumentType } from '@/features/product-config/masters/api/masters';;
import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import TableSkeleton from "@/components/loaders/TableSkeleton";

// Mock data for metadata management
const initialProjectTypes = [
  { id: 1, label: "Residential", active: true, order: 1 },
  { id: 2, label: "Commercial", active: true, order: 2 },
  { id: 3, label: "Industrial", active: true, order: 3 },
  { id: 4, label: "Infrastructure", active: true, order: 4 },
  { id: 5, label: "Mixed-Use", active: true, order: 5 },
  { id: 6, label: "Others", active: true, order: 6 },
];

const initialSubProjectTypes = [
  { id: 1, projectTypeId: 1, label: "Villa", active: true, order: 1 },
  { id: 2, projectTypeId: 1, label: "Apartment", active: true, order: 2 },
  { id: 3, projectTypeId: 2, label: "Office Building", active: true, order: 1 },
  { id: 4, projectTypeId: 2, label: "Retail Space", active: true, order: 2 },
  { id: 5, projectTypeId: 3, label: "Warehouse", active: true, order: 1 },
  { id: 6, projectTypeId: 3, label: "Factory", active: true, order: 2 },
];

const initialConstructionTypes = [
  { id: 1, label: "Concrete", active: true, order: 1 },
  { id: 2, label: "Steel", active: true, order: 2 },
  { id: 3, label: "Pre-fab", active: true, order: 3 },
  { id: 4, label: "Wood", active: true, order: 4 },
  { id: 5, label: "Mixed", active: true, order: 5 },
];

const initialRoleTypes = [
  { id: 1, label: "Principal", active: true, order: 1 },
  { id: 2, label: "Contractor", active: true, order: 2 },
  { id: 3, label: "Subcontractor", active: true, order: 3 },
  { id: 4, label: "JV", active: true, order: 4 },
];

const initialContractTypes = [
  { id: 1, label: "Turnkey", active: true, order: 1 },
  { id: 2, label: "EPC", active: true, order: 2 },
  { id: 3, label: "Design & Build", active: true, order: 3 },
  { id: 4, label: "Supply", active: true, order: 4 },
  { id: 5, label: "Install", active: true, order: 5 },
  { id: 6, label: "Others", active: true, order: 6 },
];

const initialSoilTypes = [
  { id: 1, label: "Rock", active: true, order: 1 },
  { id: 2, label: "Clay", active: true, order: 2 },
  { id: 3, label: "Sandy", active: true, order: 3 },
  { id: 4, label: "Mixed", active: true, order: 4 },
  { id: 5, label: "Unknown", active: true, order: 5 },
];

const initialSubcontractorTypes = [
  { id: 1, label: "Supply", active: true, order: 1 },
  { id: 2, label: "Install", active: true, order: 2 },
  { id: 3, label: "Supply & Install", active: true, order: 3 },
  { id: 4, label: "Design", active: true, order: 4 },
  { id: 5, label: "Others", active: true, order: 5 },
];

const initialConsultantRoles = [
  { id: 1, label: "Structural Engineer", active: true, order: 1 },
  { id: 2, label: "MEP Engineer", active: true, order: 2 },
  { id: 3, label: "Civil Engineer", active: true, order: 3 },
  { id: 4, label: "Architect", active: true, order: 4 },
  { id: 5, label: "Project Manager", active: true, order: 5 },
  { id: 6, label: "Geotechnical Engineer", active: true, order: 6 },
  { id: 7, label: "Environmental Consultant", active: true, order: 7 },
  { id: 8, label: "Safety Consultant", active: true, order: 8 },
  { id: 9, label: "Others", active: true, order: 9 },
];

const initialSecurityTypes = [
  { id: 1, label: "24/7 Guarded", active: true, order: 1 },
  { id: 2, label: "CCTV", active: true, order: 2 },
  { id: 3, label: "Fenced", active: true, order: 3 },
  { id: 4, label: "None", active: true, order: 4 },
];

const initialAreaTypes = [
  { id: 1, label: "Urban", active: true, order: 1 },
  { id: 2, label: "Congested Area", active: true, order: 2 },
];


const initialDocumentTypes = documentTypes;

const initialCountries: any[] = [];
const initialRegions: any[] = [];
const initialZones: any[] = [];

const MastersManagement = () => {
  const { toast } = useToast();
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();
  const [projectTypes, setProjectTypes] = useState(initialProjectTypes);
  const [subProjectTypes, setSubProjectTypes] = useState(initialSubProjectTypes);
  const [constructionTypes, setConstructionTypes] = useState(initialConstructionTypes);
  const [roleTypes, setRoleTypes] = useState(initialRoleTypes);
  const [contractTypes, setContractTypes] = useState(initialContractTypes);
  const [soilTypes, setSoilTypes] = useState(initialSoilTypes);
  const [subcontractorTypes, setSubcontractorTypes] = useState(initialSubcontractorTypes);
  const [consultantRoles, setConsultantRoles] = useState(initialConsultantRoles);
  const [securityTypes, setSecurityTypes] = useState(initialSecurityTypes);
  const [areaTypes, setAreaTypes] = useState(initialAreaTypes);

  const [documentTypes, setDocumentTypes] = useState(initialDocumentTypes);
  const [countries, setCountries] = useState(initialCountries);
  const [regions, setRegions] = useState(initialRegions);
  const [zones, setZones] = useState(initialZones);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const [pts, spts, cts, rts, cnts, sts, scts, crs, secs, arts, dts, cs, rs, zs] = await Promise.all([
          listMasterProjectTypes(),
          listMasterSubProjectTypes(),
          listMasterConstructionTypes(),
          listMasterRoleTypes(),
          listMasterContractTypes(),
          listMasterSoilTypes(),
          listMasterSubcontractorTypes(),
          listMasterConsultantRoles(),
          listMasterSecurityTypes(),
          listMasterAreaTypes(),
          listMasterDocumentTypes(),
          listMasterCountries(),
          listMasterRegions(),
          listMasterZones(),
        ]);
        if (!mounted) return;
        setProjectTypes(pts);
        setSubProjectTypes(spts);
        setConstructionTypes(cts);
        setRoleTypes(rts);
        setContractTypes(cnts);
        setSoilTypes(sts);
        setSubcontractorTypes(scts);
        setConsultantRoles(crs);
        setSecurityTypes(secs);
        setAreaTypes(arts);
        setDocumentTypes(dts.map(d => ({ id: d.id, value: d.label.toLowerCase().replace(/[^a-z0-9]+/g, '-'), label: d.label, description: d.description || "", required: d.required, active: d.active, order: d.order })));
        setCountries(cs);
        setRegions(rs.map(r => ({ id: r.id, label: r.label, countryId: r.countryId, active: r.active, order: 0 })));
        setZones(zs.map(z => ({ id: z.id, label: z.label, regionId: z.regionId, active: z.active, order: 0 })));
      } catch (err: any) {
        const status = err?.status;
        const friendly =
          status === 400 ? 'Invalid request while loading masters.' :
            status === 401 ? 'Session expired. Please log in again.' :
              status === 403 ? 'You are not authorized to load masters.' :
                status === 500 ? 'Server error while fetching masters.' :
                  err?.message || 'Failed to load masters.';
        setLoadError(friendly);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const [editingItem, setEditingItem] = useState<any>(null);
  const [newItem, setNewItem] = useState<any>({ label: "", active: true });
  const [activeSection, setActiveSection] = useState("project-types");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [editDialogOpenId, setEditDialogOpenId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);

  // Custom master data types
  const [customMasterTypes, setCustomMasterTypes] = useState<Array<{ id: string; label: string; icon: any; data: any[] }>>([]);
  const [isCreateMasterTypeDialogOpen, setIsCreateMasterTypeDialogOpen] = useState(false);
  const [newMasterTypeName, setNewMasterTypeName] = useState("");
  const [newMasterTypeId, setNewMasterTypeId] = useState("");

  const handleAddItem = async (type: string, setterFunction: any, currentItems: any[]) => {
    if (!newItem.label) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    try {
      setIsCreating(true);
      const status = newItem.active ? 'active' : 'inactive';
      let created: any | null = null;
      switch (type) {
        case 'project-types':
          created = await createMasterProjectType({ name: newItem.label, status, display_order: newItem.order || (currentItems.length + 1) });
          break;
        case 'sub-project-types':
          created = await createMasterSubProjectType({ project_type_id: newItem.projectTypeId, name: newItem.label, status, display_order: newItem.order || (currentItems.length + 1) });
          break;
        case 'construction-types':
          created = await createMasterConstructionType({ name: newItem.label, status, display_order: newItem.order || (currentItems.length + 1) });
          break;
        case 'countries':
          created = await createMasterCountry({ name: newItem.label, status, display_order: newItem.order || (currentItems.length + 1) });
          break;
        case 'regions':
          created = await createMasterRegion({ country_id: newItem.countryId, name: newItem.label, status, display_order: newItem.order || (currentItems.length + 1) });
          break;
        case 'zones':
          created = await createMasterZone({ region_id: newItem.regionId, name: newItem.label, status, display_order: newItem.order || (currentItems.length + 1) });
          break;
        case 'role-types':
          created = await createMasterRoleType({ display_label: newItem.label, status, display_order: newItem.order || (currentItems.length + 1) });
          break;
        case 'contract-types':
          created = await createMasterContractType({ name: newItem.label, status, display_order: newItem.order || (currentItems.length + 1) });
          break;
        case 'soil-types':
          created = await createMasterSoilType({ name: newItem.label, status, display_order: newItem.order || (currentItems.length + 1) });
          break;
        case 'subcontractor-types':
          created = await createMasterSubcontractorType({ display_label: newItem.label, status, display_order: newItem.order || (currentItems.length + 1) });
          break;
        case 'consultant-roles':
          created = await createMasterConsultantRole({ display_label: newItem.label, status, display_order: newItem.order || (currentItems.length + 1) });
          break;
        case 'security-types':
          created = await createMasterSecurityType({ display_label: newItem.label, status, display_order: newItem.order || (currentItems.length + 1) });
          break;
        case 'area-types':
          created = await createMasterAreaType({ display_label: newItem.label, status, display_order: newItem.order || (currentItems.length + 1) });
          break;
        case 'document-types':
          created = await createMasterDocumentType({ display_label: newItem.label, description: newItem.description || '', required: newItem.required ? 'required' : 'optional', status, display_order: newItem.order || (currentItems.length + 1) });
          break;
        default:
          break;
      }
      if (created) {
        // Normalize created into UI item shape
        const added = {
          id: created.id,
          label: created.name || created.display_label || newItem.label,
          active: (created.status || status) === 'active',
          order: created.display_order || (currentItems.length + 1),
          projectTypeId: created.project_type_id ?? newItem.projectTypeId,
          countryId: created.country_id ?? newItem.countryId,
          regionId: created.region_id ?? newItem.regionId,
          description: created.description ?? newItem.description,
          required: (created.required ? created.required === 'required' : newItem.required) || false,
        };
        setterFunction([...currentItems, added]);
        setNewItem({ label: "", active: true });
        setIsAddDialogOpen(false); // Close the dialog
        toast({ title: 'Success', description: `${added.label} has been added successfully` });
      }
    } catch (err: any) {
      const s = err?.status;
      const friendly = s === 400 ? 'Invalid data' : s === 401 ? 'Session expired' : s === 403 ? 'Not authorized' : s === 500 ? 'Server error' : (err?.message || 'Create failed');
      toast({ title: 'Create failed', description: friendly, variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateItem = async (type: string, setterFunction: any, currentItems: any[]) => {
    if (!editingItem.label) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      const status = editingItem.active ? 'active' : 'inactive';
      switch (type) {
        case 'project-types':
          await updateMasterProjectType(editingItem.id, { name: editingItem.label, status, display_order: editingItem.order || 0 });
          break;
        case 'sub-project-types':
          await updateMasterSubProjectType(editingItem.id, { project_type_id: editingItem.projectTypeId, name: editingItem.label, status, display_order: editingItem.order || 0 });
          break;
        case 'construction-types':
          await updateMasterConstructionType(editingItem.id, { name: editingItem.label, status, display_order: editingItem.order || 0 });
          break;
        case 'countries':
          await updateMasterCountry(editingItem.id, { name: editingItem.label, status, display_order: editingItem.order || 0 });
          break;
        case 'regions':
          await updateMasterRegion(editingItem.id, { country_id: editingItem.countryId, name: editingItem.label, status, display_order: editingItem.order || 0 });
          break;
        case 'zones':
          await updateMasterZone(editingItem.id, { region_id: editingItem.regionId, name: editingItem.label, status, display_order: editingItem.order || 0 });
          break;
        case 'role-types':
          await updateMasterRoleType(editingItem.id, { display_label: editingItem.label, status, display_order: editingItem.order || 0 });
          break;
        case 'contract-types':
          await updateMasterContractType(editingItem.id, { name: editingItem.label, status, display_order: editingItem.order || 0 });
          break;
        case 'soil-types':
          await updateMasterSoilType(editingItem.id, { name: editingItem.label, status, display_order: editingItem.order || 0 });
          break;
        case 'subcontractor-types':
          await updateMasterSubcontractorType(editingItem.id, { display_label: editingItem.label, status, display_order: editingItem.order || 0 });
          break;
        case 'consultant-roles':
          await updateMasterConsultantRole(editingItem.id, { display_label: editingItem.label, status, display_order: editingItem.order || 0 });
          break;
        case 'security-types':
          await updateMasterSecurityType(editingItem.id, { display_label: editingItem.label, status, display_order: editingItem.order || 0 });
          break;
        case 'area-types':
          await updateMasterAreaType(editingItem.id, { display_label: editingItem.label, status, display_order: editingItem.order || 0 });
          break;
        case 'document-types':
          await updateMasterDocumentType(editingItem.id, { display_label: editingItem.label, description: editingItem.description || '', required: editingItem.required ? 'required' : 'optional', status, display_order: editingItem.order || 0 });
          break;
        default:
          break;
      }

      setterFunction(currentItems.map(item => item.id === editingItem.id ? editingItem : item));
      setEditingItem(null);
      setEditDialogOpenId(null);
      toast({ title: 'Success', description: 'Item has been updated successfully' });
    } catch (err: any) {
      const s = err?.status;
      const friendly = s === 400 ? 'Invalid data' : s === 401 ? 'Session expired' : s === 403 ? 'Not authorized' : s === 500 ? 'Server error' : (err?.message || 'Update failed');
      toast({ title: 'Update failed', description: friendly, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = (type: string, id: number, setterFunction: any, currentItems: any[]) => {
    const item = currentItems.find(item => item.id === id);
    const itemName = item?.label || 'Item';

    showConfirmDialog(
      {
        title: "Delete Item",
        description: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
        confirmText: "Delete",
        variant: "destructive"
      },
      async () => {
        try {
          switch (type) {
            case 'project-types':
              await deleteMasterProjectType(id); break;
            case 'sub-project-types':
              await deleteMasterSubProjectType(id); break;
            case 'construction-types':
              await deleteMasterConstructionType(id); break;
            case 'countries':
              await deleteMasterCountry(id); break;
            case 'regions':
              await deleteMasterRegion(id); break;
            case 'zones':
              await deleteMasterZone(id); break;
            case 'role-types':
              await deleteMasterRoleType(id); break;
            case 'contract-types':
              await deleteMasterContractType(id); break;
            case 'soil-types':
              await deleteMasterSoilType(id); break;
            case 'subcontractor-types':
              await deleteMasterSubcontractorType(id); break;
            case 'consultant-roles':
              await deleteMasterConsultantRole(id); break;
            case 'security-types':
              await deleteMasterSecurityType(id); break;
            case 'area-types':
              await deleteMasterAreaType(id); break;
            case 'document-types':
              await deleteMasterDocumentType(id); break;
            default:
              break;
          }
          setterFunction(currentItems.filter(item => item.id !== id));
          toast({ title: 'Success', description: 'Item has been deleted successfully' });
        } catch (err: any) {
          const s = err?.status;
          const friendly = s === 400 ? 'Invalid request' : s === 401 ? 'Session expired' : s === 403 ? 'Not authorized' : s === 500 ? 'Server error' : (err?.message || 'Delete failed');
          toast({ title: 'Delete failed', description: friendly, variant: 'destructive' });
        }
      }
    );
  };

  const toggleActive = (id: number, setterFunction: any, currentItems: any[]) => {
    setterFunction(currentItems.map(item =>
      item.id === id ? { ...item, active: !item.active } : item
    ));
  };

  const renderMasterTable = (items: any[], setterFunction: any, type: string) => (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </CardTitle>
            <CardDescription>
              Manage {type.replace('-', ' ')} options for the proposal form
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add New
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-white">
              <DialogHeader>
                <DialogTitle>Add New {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</DialogTitle>
                <DialogDescription>
                  Create a new option for the {type.replace('-', ' ')} field
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="label">Display Label *</Label>
                  <Input
                    id="label"
                    value={newItem.label}
                    onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
                    placeholder="e.g., Commercial"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="active"
                    checked={newItem.active}
                    onCheckedChange={(checked) => setNewItem({ ...newItem, active: checked === true })}
                  />
                  <Label htmlFor="active">Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => handleAddItem(type, setterFunction, items)} disabled={isCreating}>
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
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Display Label</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items
              .sort((a, b) => a.order - b.order)
              .map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.order}</TableCell>
                  <TableCell>{item.label}</TableCell>
                  <TableCell>
                    <Badge
                      variant={item.active ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => toggleActive(item.id, setterFunction, items)}
                    >
                      {item.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Dialog open={editDialogOpenId === item.id} onOpenChange={(o) => setEditDialogOpenId(o ? item.id : null)}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setEditingItem({ ...item }); setEditDialogOpenId(item.id); }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] bg-white">
                          <DialogHeader>
                            <DialogTitle>Edit {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</DialogTitle>
                            <DialogDescription>
                              Update the {type.replace('-', ' ')} option
                            </DialogDescription>
                          </DialogHeader>
                          {editingItem && (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="edit-label">Display Label *</Label>
                                <Input
                                  id="edit-label"
                                  value={editingItem.label}
                                  onChange={(e) => setEditingItem({ ...editingItem, label: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-order">Order</Label>
                                <Input
                                  id="edit-order"
                                  type="number"
                                  value={editingItem.order}
                                  onChange={(e) => setEditingItem({ ...editingItem, order: parseInt(e.target.value) })}
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="edit-active"
                                  checked={editingItem.active}
                                  onChange={(e) => setEditingItem({ ...editingItem, active: e.target.checked })}
                                  className="h-4 w-4 rounded border border-input bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                />
                                <Label htmlFor="edit-active">Active</Label>
                              </div>
                            </div>
                          )}
                          <DialogFooter>
                            <Button onClick={() => handleUpdateItem(type, setterFunction, items)} disabled={isSaving}>
                              {isSaving ? (
                                <span className="inline-flex items-center">
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Saving...
                                </span>
                              ) : (
                                'Update Item'
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteItem(type, item.id, setterFunction, items)}
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

  const renderSubProjectTable = (items: any[], setterFunction: any, type: string) => (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Sub Project Types
            </CardTitle>
            <CardDescription>
              Manage sub project types linked to project types
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add New
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-white">
              <DialogHeader>
                <DialogTitle>Add New Sub Project Type</DialogTitle>
                <DialogDescription>
                  Create a new sub project type linked to a project type
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project-type">Project Type *</Label>
                  <Select onValueChange={(value) => setNewItem({ ...newItem, projectTypeId: parseInt(value) })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project type" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectTypes.filter(pt => pt.active).map((projectType) => (
                        <SelectItem key={projectType.id} value={projectType.id.toString()}>
                          {projectType.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="label">Sub Project Type *</Label>
                  <Input
                    id="label"
                    value={newItem.label}
                    onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
                    placeholder="e.g., Villa"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="active"
                    checked={newItem.active}
                    onCheckedChange={(checked) => setNewItem({ ...newItem, active: checked === true })}
                  />
                  <Label htmlFor="active">Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => handleAddItem(type, setterFunction, items)} disabled={isCreating}>
                  {isCreating ? (
                    <span className="inline-flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    'Add Sub Project Type'
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
              <TableHead>Order</TableHead>
              <TableHead>Project Type</TableHead>
              <TableHead>Sub Project Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items
              .sort((a, b) => a.order - b.order)
              .map((item) => {
                const projectType = projectTypes.find(pt => pt.id === item.projectTypeId);
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.order}</TableCell>
                    <TableCell>{projectType?.label || 'Unknown'}</TableCell>
                    <TableCell>{item.label}</TableCell>
                    <TableCell>
                      <Badge
                        variant={item.active ? "default" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => toggleActive(item.id, setterFunction, items)}
                      >
                        {item.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-2 justify-center">
                        <Dialog open={editDialogOpenId === item.id} onOpenChange={(o) => setEditDialogOpenId(o ? item.id : null)}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setEditingItem({ ...item }); setEditDialogOpenId(item.id); }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px] bg-white">
                            <DialogHeader>
                              <DialogTitle>Edit Sub Project Type</DialogTitle>
                              <DialogDescription>
                                Update the sub project type information
                              </DialogDescription>
                            </DialogHeader>
                            {editingItem && (
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="edit-project-type">Project Type *</Label>
                                  <Select value={editingItem.projectTypeId?.toString()} onValueChange={(value) => setEditingItem({ ...editingItem, projectTypeId: parseInt(value) })}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select project type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {projectTypes.filter(pt => pt.active).map((projectType) => (
                                        <SelectItem key={projectType.id} value={projectType.id.toString()}>
                                          {projectType.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-label">Sub Project Type *</Label>
                                  <Input
                                    id="edit-label"
                                    value={editingItem.label}
                                    onChange={(e) => setEditingItem({ ...editingItem, label: e.target.value })}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-order">Order</Label>
                                  <Input
                                    id="edit-order"
                                    type="number"
                                    value={editingItem.order}
                                    onChange={(e) => setEditingItem({ ...editingItem, order: parseInt(e.target.value) })}
                                  />
                                </div>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id="edit-active"
                                    checked={editingItem.active}
                                    onChange={(e) => setEditingItem({ ...editingItem, active: e.target.checked })}
                                    className="h-4 w-4 rounded border border-input bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                  />
                                  <Label htmlFor="edit-active">Active</Label>
                                </div>
                              </div>
                            )}
                            <DialogFooter>
                              <Button onClick={() => handleUpdateItem(type, setterFunction, items)} disabled={isSaving}>
                                {isSaving ? (
                                  <span className="inline-flex items-center">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                  </span>
                                ) : (
                                  'Update Sub Project Type'
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteItem(type, item.id, setterFunction, items)}
                          className="text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const renderDocumentTable = (items: any[], setterFunction: any, type: string) => (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Document Types
            </CardTitle>
            <CardDescription>
              Manage document types required for quote creation
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add New
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px] bg-white">
              <DialogHeader>
                <DialogTitle>Add New Document Type</DialogTitle>
                <DialogDescription>
                  Create a new document type for quote creation
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="label">Display Label *</Label>
                  <Input
                    id="label"
                    value={newItem.label}
                    onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
                    placeholder="e.g., BOQ or Cost Breakdown"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={newItem.description || ""}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="e.g., Bill of quantities or detailed cost breakdown"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="required"
                    checked={newItem.required || false}
                    onChange={(e) => setNewItem({ ...newItem, required: e.target.checked })}
                    className="h-4 w-4 rounded border border-input bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  />
                  <Label htmlFor="required">Required Document</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="active"
                    checked={newItem.active}
                    onCheckedChange={(checked) => setNewItem({ ...newItem, active: checked === true })}
                  />
                  <Label htmlFor="active">Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => handleAddItem(type, setterFunction, items)} disabled={isCreating}>
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
              <TableHead>Order</TableHead>
              <TableHead>Display Label</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Required</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items
              .sort((a, b) => a.order - b.order)
              .map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.order}</TableCell>
                  <TableCell>{item.label}</TableCell>
                  <TableCell className="max-w-xs truncate">{item.description}</TableCell>
                  <TableCell>
                    <Badge
                      variant={item.required ? "default" : "secondary"}
                    >
                      {item.required ? "Required" : "Optional"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={item.active ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => toggleActive(item.id, setterFunction, items)}
                    >
                      {item.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Dialog open={editDialogOpenId === item.id} onOpenChange={(o) => setEditDialogOpenId(o ? item.id : null)}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setEditingItem({ ...item }); setEditDialogOpenId(item.id); }}
                          >
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
                          {editingItem && (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="edit-label">Display Label *</Label>
                                <Input
                                  id="edit-label"
                                  value={editingItem.label}
                                  onChange={(e) => setEditingItem({ ...editingItem, label: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-description">Description</Label>
                                <Input
                                  id="edit-description"
                                  value={editingItem.description || ""}
                                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-order">Order</Label>
                                <Input
                                  id="edit-order"
                                  type="number"
                                  value={editingItem.order}
                                  onChange={(e) => setEditingItem({ ...editingItem, order: parseInt(e.target.value) })}
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="edit-required"
                                  checked={editingItem.required || false}
                                  onCheckedChange={(checked) => setEditingItem({ ...editingItem, required: checked === true })}
                                />
                                <Label htmlFor="edit-required">Required Document</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="edit-active"
                                  checked={editingItem.active}
                                  onCheckedChange={(checked) => setEditingItem({ ...editingItem, active: checked === true })}
                                />
                                <Label htmlFor="edit-active">Active</Label>
                              </div>
                            </div>
                          )}
                          <DialogFooter>
                            <Button onClick={() => handleUpdateItem(type, setterFunction, items)} disabled={isSaving}>
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
                        onClick={() => handleDeleteItem(type, item.id, setterFunction, items)}
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


  const renderLocationTable = (items: any[], setterFunction: any, type: string, parentType?: string) => (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </CardTitle>
            <CardDescription>
              Manage {type.replace('-', ' ')} for location hierarchy
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add New
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-white">
              <DialogHeader>
                <DialogTitle>Add New {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</DialogTitle>
                <DialogDescription>
                  Create a new {type.replace('-', ' ')} entry
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {parentType && (
                  <div className="space-y-2">
                    <Label htmlFor="parent-select">{parentType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} *</Label>
                    <Select onValueChange={(value) => setNewItem({
                      ...newItem,
                      [parentType === "countries" ? "countryId" : "regionId"]: parseInt(value)
                    })}>
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${parentType.replace('-', ' ')}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {(parentType === "countries" ? countries : regions)
                          .filter((item: any) => item.active)
                          .map((item: any) => (
                            <SelectItem key={item.id} value={item.id.toString()}>
                              {item.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="label">Label *</Label>
                  <Input
                    id="label"
                    value={newItem.label}
                    onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
                    placeholder={`e.g., ${type === "countries" ? "United Arab Emirates" : type === "regions" ? "Dubai" : "Downtown Dubai"}`}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="active"
                    checked={newItem.active}
                    onCheckedChange={(checked) => setNewItem({ ...newItem, active: checked === true })}
                  />
                  <Label htmlFor="active">Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => handleAddItem(type, setterFunction, items)} disabled={isCreating}>
                  {isCreating ? (
                    <span className="inline-flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    `Add ${type.replace('-', ' ').replace(/\\b\\w/g, l => l.toUpperCase())}`
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
              {parentType && <TableHead>{parentType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</TableHead>}
              <TableHead>Label</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items
              .sort((a, b) => a.order - b.order)
              .map((item) => {
                const parentItem = parentType === "countries" ?
                  countries.find(c => c.id === item.countryId) :
                  parentType === "regions" ?
                    regions.find(r => r.id === item.regionId) : null;

                return (
                  <TableRow key={item.id}>
                    {parentType && <TableCell>{parentItem?.label || 'Unknown'}</TableCell>}
                    <TableCell>{item.label}</TableCell>
                    <TableCell>
                      <Badge
                        variant={item.active ? "default" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => toggleActive(item.id, setterFunction, items)}
                      >
                        {item.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-2 justify-center">
                        <Dialog open={editDialogOpenId === item.id} onOpenChange={(o) => setEditDialogOpenId(o ? item.id : null)}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setEditingItem({ ...item }); setEditDialogOpenId(item.id); }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px] bg-white">
                            <DialogHeader>
                              <DialogTitle>Edit {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</DialogTitle>
                              <DialogDescription>
                                Update the {type.replace('-', ' ')} information
                              </DialogDescription>
                            </DialogHeader>
                            {editingItem && (
                              <div className="space-y-4">
                                {parentType && (
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-parent-select">{parentType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} *</Label>
                                    <Select
                                      value={(parentType === "countries" ? editingItem.countryId : editingItem.regionId)?.toString()}
                                      onValueChange={(value) => setEditingItem({
                                        ...editingItem,
                                        [parentType === "countries" ? "countryId" : "regionId"]: parseInt(value)
                                      })}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder={`Select ${parentType.replace('-', ' ')}`} />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {(parentType === "countries" ? countries : regions)
                                          .filter((item: any) => item.active)
                                          .map((item: any) => (
                                            <SelectItem key={item.id} value={item.id.toString()}>
                                              {item.label}
                                            </SelectItem>
                                          ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}
                                <div className="space-y-2">
                                  <Label htmlFor="edit-label">Label *</Label>
                                  <Input
                                    id="edit-label"
                                    value={editingItem.label}
                                    onChange={(e) => setEditingItem({ ...editingItem, label: e.target.value })}
                                  />
                                </div>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id="edit-active"
                                    checked={editingItem.active}
                                    onChange={(e) => setEditingItem({ ...editingItem, active: e.target.checked })}
                                    className="h-4 w-4 rounded border border-input bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                  />
                                  <Label htmlFor="edit-active">Active</Label>
                                </div>
                              </div>
                            )}
                            <DialogFooter>
                              <Button onClick={() => handleUpdateItem(type, setterFunction, items)} disabled={isSaving}>
                                {isSaving ? (
                                  <span className="inline-flex items-center">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                  </span>
                                ) : (
                                  `Update ${type.replace('-', ' ').replace(/\\b\\w/g, l => l.toUpperCase())}`
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteItem(type, item.id, setterFunction, items)}
                          className="text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex flex-col cityscape-bg">
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Masters Management
              </h1>
              <p className="text-lg text-muted-foreground">
                Manage metadata and dropdown options for proposal form fields
              </p>
            </div>
          </div>

          {/* Sidebar + Content Layout */}
          <div className="flex gap-6 h-[calc(100vh-12rem)]">
            {/* Sidebar */}
            <div className="w-80 bg-primary/5 rounded-lg p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Master Data Types</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateMasterTypeDialogOpen(true)}
                  className="gap-1"
                  title="Add New Master Data Type"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-xs">Add</span>
                </Button>
              </div>
              <div className="space-y-2">
                {[
                  { id: "project-types", label: "Project Types", icon: Building, count: projectTypes.filter(t => t.active).length },
                  { id: "sub-project-types", label: "Sub Project Types", icon: Building, count: subProjectTypes.filter(t => t.active).length },
                  { id: "construction-types", label: "Construction Types", icon: Settings, count: constructionTypes.filter(t => t.active).length },
                  { id: "countries", label: "Countries", icon: Globe, count: countries.filter(t => t.active).length },
                  { id: "regions", label: "Regions", icon: MapPin, count: regions.filter(t => t.active).length },
                  { id: "zones", label: "Zones", icon: MapPin, count: zones.filter(t => t.active).length },
                  { id: "role-types", label: "Role Types", icon: Shield, count: roleTypes.filter(t => t.active).length },
                  { id: "contract-types", label: "Contract Types", icon: FileText, count: contractTypes.filter(t => t.active).length },
                  { id: "soil-types", label: "Soil Types", icon: MapPin, count: soilTypes.filter(t => t.active).length },
                  { id: "subcontractor-types", label: "Subcontractor Types", icon: Settings, count: subcontractorTypes.filter(t => t.active).length },
                  { id: "consultant-roles", label: "Consultant Roles", icon: Shield, count: consultantRoles.filter(t => t.active).length },
                  { id: "security-types", label: "Security Types", icon: Shield, count: securityTypes.filter(t => t.active).length },
                  { id: "area-types", label: "Area Types", icon: MapPin, count: areaTypes.filter(t => t.active).length },

                  { id: "document-types", label: "Document Types", icon: FileText, count: documentTypes.filter(t => t.active).length },
                  ...customMasterTypes.map((customType) => ({
                    id: customType.id,
                    label: customType.label,
                    icon: customType.icon || Database,
                    count: customType.data.filter((t: any) => t.active).length,
                  })),
                ].map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all flex items-center justify-between ${activeSection === section.id
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'hover:bg-primary/10 text-foreground'
                      }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <section.icon className="w-4 h-4" />
                      <span className="font-medium text-sm">{section.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={activeSection === section.id ? "secondary" : "outline"} className="text-xs">
                        {section.count}
                      </Badge>
                      {customMasterTypes.some(t => t.id === section.id) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            showConfirmDialog({
                              title: "Delete Master Data Type",
                              description: `Are you sure you want to delete "${section.label}"? This will remove all associated data.`,
                              onConfirm: () => {
                                setCustomMasterTypes(prev => prev.filter(t => t.id !== section.id));
                                if (activeSection === section.id) {
                                  setActiveSection("project-types");
                                }
                                toast({
                                  title: "Master Data Type Deleted",
                                  description: `${section.label} has been deleted successfully.`,
                                });
                              },
                            });
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">
              {activeSection === "project-types" && renderMasterTable(projectTypes, setProjectTypes, "project-types")}
              {activeSection === "sub-project-types" && renderSubProjectTable(subProjectTypes, setSubProjectTypes, "sub-project-types")}
              {activeSection === "construction-types" && renderMasterTable(constructionTypes, setConstructionTypes, "construction-types")}
              {activeSection === "countries" && renderLocationTable(countries, setCountries, "countries")}
              {activeSection === "regions" && renderLocationTable(regions, setRegions, "regions", "countries")}
              {activeSection === "zones" && renderLocationTable(zones, setZones, "zones", "regions")}
              {activeSection === "role-types" && renderMasterTable(roleTypes, setRoleTypes, "role-types")}
              {activeSection === "contract-types" && renderMasterTable(contractTypes, setContractTypes, "contract-types")}
              {activeSection === "soil-types" && renderMasterTable(soilTypes, setSoilTypes, "soil-types")}
              {activeSection === "subcontractor-types" && renderMasterTable(subcontractorTypes, setSubcontractorTypes, "subcontractor-types")}
              {activeSection === "consultant-roles" && renderMasterTable(consultantRoles, setConsultantRoles, "consultant-roles")}
              {activeSection === "security-types" && renderMasterTable(securityTypes, setSecurityTypes, "security-types")}
              {activeSection === "area-types" && renderMasterTable(areaTypes, setAreaTypes, "area-types")}

              {activeSection === "document-types" && renderDocumentTable(documentTypes, setDocumentTypes, "document-types")}
              {customMasterTypes.map((customType) => {
                if (activeSection === customType.id) {
                  const customData = customType.data;
                  const setCustomData = (newData: any[]) => {
                    setCustomMasterTypes(prev => prev.map(type =>
                      type.id === customType.id ? { ...type, data: newData } : type
                    ));
                  };
                  return renderMasterTable(customData, setCustomData, customType.id);
                }
                return null;
              })}
            </div>
          </div>

          {/* Create New Master Data Type Dialog */}
          <Dialog open={isCreateMasterTypeDialogOpen} onOpenChange={setIsCreateMasterTypeDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Master Data Type</DialogTitle>
                <DialogDescription>
                  Add a new master data type to manage custom metadata
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="master-type-name">Master Data Type Name *</Label>
                  <Input
                    id="master-type-name"
                    value={newMasterTypeName}
                    onChange={(e) => {
                      setNewMasterTypeName(e.target.value);
                      // Auto-generate ID from name
                      const generatedId = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                      setNewMasterTypeId(generatedId);
                    }}
                    placeholder="e.g., Material Types, Equipment Types"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="master-type-id">ID (Auto-generated)</Label>
                  <Input
                    id="master-type-id"
                    value={newMasterTypeId}
                    onChange={(e) => setNewMasterTypeId(e.target.value)}
                    placeholder="e.g., material-types"
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsCreateMasterTypeDialogOpen(false);
                  setNewMasterTypeName("");
                  setNewMasterTypeId("");
                }}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  if (!newMasterTypeName.trim() || !newMasterTypeId.trim()) {
                    toast({
                      title: "Validation Error",
                      description: "Please enter a master data type name",
                      variant: "destructive",
                    });
                    return;
                  }

                  // Check if ID already exists
                  const existingIds = [
                    "project-types", "sub-project-types", "construction-types", "countries",
                    "regions", "zones", "role-types", "contract-types", "soil-types",
                    "subcontractor-types", "consultant-roles", "security-types", "area-types",
                    "document-types", ...customMasterTypes.map(t => t.id)
                  ];

                  if (existingIds.includes(newMasterTypeId)) {
                    toast({
                      title: "Error",
                      description: "A master data type with this ID already exists",
                      variant: "destructive",
                    });
                    return;
                  }

                  // Add new custom master type
                  setCustomMasterTypes(prev => [...prev, {
                    id: newMasterTypeId,
                    label: newMasterTypeName.trim(),
                    icon: Database,
                    data: [],
                  }]);

                  // Set as active section
                  setActiveSection(newMasterTypeId);

                  setIsCreateMasterTypeDialogOpen(false);
                  setNewMasterTypeName("");
                  setNewMasterTypeId("");

                  toast({
                    title: "Master Data Type Created",
                    description: `${newMasterTypeName} has been created successfully.`,
                  });
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Master Data Type
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <ConfirmDialog />
        </div>
      </div>
    </div>
  );
};

export default MastersManagement;


