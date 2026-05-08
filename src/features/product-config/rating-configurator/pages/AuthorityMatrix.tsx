import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Plus, X } from "lucide-react";
import { useToast } from '@/shared/hooks/use-toast';
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAuthorityMatrix, saveAuthorityMatrix, type Role, type SubRole, type Permission } from '@/features/product-config/rating-configurator/api/authorityMatrix';

interface Feature {
  id: string;
  category: string;
  name: string;
}

interface RoleWithSubRoles {
  id: string;
  name: string;
  subRoles: SubRole[];
}

const AuthorityMatrix = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const productId = searchParams.get("productId");
  const productName = searchParams.get("productName") || "Product";
  const productVersion = searchParams.get("productVersion") || "";

  // All product features from provisions
  const features: Feature[] = [
    // Forms and Templates
    { id: "proposalFormDesign", category: "Forms and Templates", name: "Fill Proposal Form" },
    { id: "quoteDetailsPageDesign", category: "Forms and Templates", name: "Quote Details Page" },
    { id: "policyDetailsPageDesign", category: "Forms and Templates", name: "Policy Details Page" },

    // Administration
    { id: "reInsurerOnboardingDesign", category: "Administration", name: "Re-Insurer Onboarding" },
    { id: "insurerOnboardingDesign", category: "Administration", name: "Insurer Onboarding" },
    { id: "brokerOnboardingDesign", category: "Administration", name: "Broker Onboarding" },
    { id: "userOnboardingDesign", category: "Administration", name: "User Onboarding" },

    // Rating and Underwriting
    { id: "ratingConfiguratorDesign", category: "Rating and Underwriting", name: "Rating Structure Design" },
    { id: "underwritingDesign", category: "Rating and Underwriting", name: "Underwriting" },
    { id: "documentDesign", category: "Rating and Underwriting", name: "Document Configurator" },
    { id: "cewsDesign", category: "Rating and Underwriting", name: "CEWs (Coverages, Exclusions, Warranties)" },

    // Analytics
    { id: "kpisDesign", category: "Analytics", name: "KPIs" },
  ];

  // Default roles with initial sub-roles
  const defaultRoles: RoleWithSubRoles[] = [
    { id: "underwriter", name: "Underwriter", subRoles: ["Underwriter Admin", "Underwriter User", "Senior Underwriter"] },
    { id: "distributor", name: "Distributor", subRoles: ["Distributor Admin", "Distributor User", "Sales Manager"] },
    { id: "reinsurer", name: "Reinsurer", subRoles: ["Reinsurer Admin", "Reinsurer User", "Reinsurer Analyst"] },
  ];

  const [roles, setRoles] = useState<RoleWithSubRoles[]>(defaultRoles);

  const [isCreateSubRoleDialogOpen, setIsCreateSubRoleDialogOpen] = useState(false);
  const [newSubRoleName, setNewSubRoleName] = useState("");
  const [selectedRoleForSubRole, setSelectedRoleForSubRole] = useState<string>("");

  // Initialize matrix state: feature -> roleId -> subRole -> {read, write}
  // Fill with test data - some permissions pre-selected
  const [matrix, setMatrix] = useState<Record<string, Record<string, Record<SubRole, Permission>>>>(() => {
    const initial: Record<string, Record<string, Record<SubRole, Permission>>> = {};
    features.forEach(feature => {
      initial[feature.id] = {};
      defaultRoles.forEach(role => {
        initial[feature.id][role.id] = {} as Record<SubRole, Permission>;
        role.subRoles.forEach(subRole => {
          // Test data: Pre-select some common permissions
          let readValue = false;
          let writeValue = false;

          // Underwriter Admin gets read and write for rating and underwriting features
          if (role.id === "underwriter" && subRole === "Underwriter Admin") {
            if (feature.id === "ratingConfiguratorDesign" || feature.id === "underwritingDesign" || feature.id === "documentDesign" || feature.id === "cewsDesign") {
              readValue = true;
              writeValue = true;
            }
          }
          // Underwriter User gets read-only for rating and underwriting features
          else if (role.id === "underwriter" && subRole === "Underwriter User") {
            if (feature.id === "ratingConfiguratorDesign" || feature.id === "underwritingDesign" || feature.id === "documentDesign") {
              readValue = true;
              writeValue = false;
            }
          }
          // Senior Underwriter gets read and write for all rating and underwriting features
          else if (role.id === "underwriter" && subRole === "Senior Underwriter") {
            if (feature.id === "ratingConfiguratorDesign" || feature.id === "underwritingDesign" || feature.id === "documentDesign" || feature.id === "cewsDesign") {
              readValue = true;
              writeValue = true;
            }
          }
          // Distributor Admin gets read and write for proposal form and quote details
          else if (role.id === "distributor" && subRole === "Distributor Admin") {
            if (feature.id === "proposalFormDesign" || feature.id === "quoteDetailsPageDesign" || feature.id === "policyDetailsPageDesign") {
              readValue = true;
              writeValue = true;
            }
          }
          // Distributor User gets read-only for proposal form and quote details
          else if (role.id === "distributor" && subRole === "Distributor User") {
            if (feature.id === "proposalFormDesign" || feature.id === "quoteDetailsPageDesign") {
              readValue = true;
              writeValue = false;
            }
          }
          // Sales Manager gets read and write for proposal form and quote details
          else if (role.id === "distributor" && subRole === "Sales Manager") {
            if (feature.id === "proposalFormDesign" || feature.id === "quoteDetailsPageDesign" || feature.id === "policyDetailsPageDesign") {
              readValue = true;
              writeValue = true;
            }
          }
          // Reinsurer Admin gets read and write for rating, underwriting, and KPIs
          else if (role.id === "reinsurer" && subRole === "Reinsurer Admin") {
            if (feature.id === "ratingConfiguratorDesign" || feature.id === "underwritingDesign" || feature.id === "documentDesign" || feature.id === "kpisDesign") {
              readValue = true;
              writeValue = true;
            }
          }
          // Reinsurer User gets read-only for rating and underwriting
          else if (role.id === "reinsurer" && subRole === "Reinsurer User") {
            if (feature.id === "ratingConfiguratorDesign" || feature.id === "underwritingDesign" || feature.id === "documentDesign") {
              readValue = true;
              writeValue = false;
            }
          }
          // Reinsurer Analyst gets read and write for KPIs and read-only for rating
          else if (role.id === "reinsurer" && subRole === "Reinsurer Analyst") {
            if (feature.id === "kpisDesign") {
              readValue = true;
              writeValue = true;
            } else if (feature.id === "ratingConfiguratorDesign" || feature.id === "underwritingDesign") {
              readValue = true;
              writeValue = false;
            }
          }

          initial[feature.id][role.id][subRole] = { read: readValue, write: writeValue };
        });
      });
    });
    return initial;
  });

  // Load authority matrix if productId is available
  useEffect(() => {
    const loadMatrix = async () => {
      if (productId) {
        try {
          setIsLoading(true);
          const authorityMatrix = await getAuthorityMatrix(productId);
          if (authorityMatrix.matrix) {
            // Load matrix data - migrate old format if needed
            const loadedMatrix: Record<string, Record<string, Record<SubRole, Permission>>> = {};
            const loadedRoles: RoleWithSubRoles[] = [];
            const roleIds = new Set<string>();

            // Get all unique role IDs from matrix
            Object.values(authorityMatrix.matrix as any).forEach((featureMatrix: any) => {
              Object.keys(featureMatrix || {}).forEach(roleId => {
                roleIds.add(roleId);
              });
            });

            // Build roles with their sub-roles and migrate matrix
            roleIds.forEach(roleId => {
              const subRolesSet = new Set<SubRole>();
              Object.values(authorityMatrix.matrix as any).forEach((featureMatrix: any) => {
                if (featureMatrix[roleId]) {
                  Object.keys(featureMatrix[roleId] || {}).forEach(subRole => {
                    subRolesSet.add(subRole);
                  });
                }
              });

              // Try to find role name from existing roles or use roleId
              const existingRole = defaultRoles.find(r => r.id === roleId);
              loadedRoles.push({
                id: roleId,
                name: existingRole?.name || roleId.charAt(0).toUpperCase() + roleId.slice(1),
                subRoles: Array.from(subRolesSet),
              });
            });

            // Migrate matrix to new format
            features.forEach(feature => {
              loadedMatrix[feature.id] = {};
              roleIds.forEach(roleId => {
                loadedMatrix[feature.id][roleId] = {} as Record<SubRole, Permission>;
                const role = loadedRoles.find(r => r.id === roleId);
                if (role) {
                  role.subRoles.forEach(subRole => {
                    const oldValue = (authorityMatrix.matrix as any)[feature.id]?.[roleId]?.[subRole];
                    if (typeof oldValue === 'boolean') {
                      // Old format: migrate to new format
                      loadedMatrix[feature.id][roleId][subRole] = {
                        read: oldValue,
                        write: oldValue,
                      };
                    } else if (oldValue && typeof oldValue === 'object' && ('read' in oldValue || 'write' in oldValue)) {
                      // New format
                      loadedMatrix[feature.id][roleId][subRole] = {
                        read: oldValue.read || false,
                        write: oldValue.write || false,
                      };
                    } else {
                      // Default
                      loadedMatrix[feature.id][roleId][subRole] = { read: false, write: false };
                    }
                  });
                }
              });
            });

            setMatrix(loadedMatrix);
            if (loadedRoles.length > 0) {
              setRoles(loadedRoles);
            }
          }
        } catch (error: any) {
          // If 404, matrix doesn't exist yet - that's okay, use defaults
          if (error.status !== 404) {
            toast({
              title: "Error",
              description: error.message || "Failed to load authority matrix",
              variant: "destructive",
            });
          }
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadMatrix();
  }, [productId, toast]);

  const togglePermission = (featureId: string, roleId: string, subRole: SubRole, permissionType: 'read' | 'write') => {
    setMatrix(prev => ({
      ...prev,
      [featureId]: {
        ...prev[featureId],
        [roleId]: {
          ...prev[featureId]?.[roleId],
          [subRole]: {
            ...prev[featureId]?.[roleId]?.[subRole],
            [permissionType]: !prev[featureId]?.[roleId]?.[subRole]?.[permissionType],
          },
        },
      },
    }));
  };

  const handleCreateSubRole = () => {
    if (!newSubRoleName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a sub-role name",
        variant: "destructive",
      });
      return;
    }

    if (!selectedRoleForSubRole) {
      toast({
        title: "Validation Error",
        description: "Please select a role",
        variant: "destructive",
      });
      return;
    }

    const role = roles.find(r => r.id === selectedRoleForSubRole);
    if (!role) return;

    // Check if sub-role already exists
    if (role.subRoles.includes(newSubRoleName.trim())) {
      toast({
        title: "Error",
        description: "A sub-role with this name already exists for this role",
        variant: "destructive",
      });
      return;
    }

    // Add sub-role to role
    setRoles(roles.map(r =>
      r.id === selectedRoleForSubRole
        ? { ...r, subRoles: [...r.subRoles, newSubRoleName.trim()] }
        : r
    ));

    // Initialize matrix for new sub-role
    setMatrix(prev => {
      const updated = { ...prev };
      features.forEach(feature => {
        if (!updated[feature.id]) {
          updated[feature.id] = {};
        }
        if (!updated[feature.id][selectedRoleForSubRole]) {
          updated[feature.id][selectedRoleForSubRole] = {};
        }
        updated[feature.id][selectedRoleForSubRole][newSubRoleName.trim()] = { read: false, write: false };
      });
      return updated;
    });

    setNewSubRoleName("");
    setSelectedRoleForSubRole("");
    setIsCreateSubRoleDialogOpen(false);

    toast({
      title: "Sub-Role Created",
      description: `${newSubRoleName} has been added to ${role.name} successfully.`,
    });
  };

  const handleDeleteSubRole = (roleId: string, subRole: SubRole) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;

    // Remove sub-role from role
    setRoles(roles.map(r =>
      r.id === roleId
        ? { ...r, subRoles: r.subRoles.filter(sr => sr !== subRole) }
        : r
    ));

    // Remove sub-role from matrix
    setMatrix(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(featureId => {
        if (updated[featureId][roleId]?.[subRole] !== undefined) {
          delete updated[featureId][roleId][subRole];
        }
      });
      return updated;
    });

    toast({
      title: "Sub-Role Removed",
      description: `${subRole} has been removed from ${role.name}.`,
    });
  };

  const handleSave = async () => {
    if (!productId) {
      toast({
        title: "Error",
        description: "Product ID is required to save authority matrix",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      await saveAuthorityMatrix(productId, matrix);
      toast({
        title: "Authority Matrix Saved",
        description: `Authority matrix for ${productName}${productVersion ? ` - Version ${productVersion}` : ''} has been saved successfully.`,
      });
      navigate("/market-admin/product-management");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save authority matrix",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const groupedFeatures = features.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, Feature[]>);

  // Get all role-subRole combinations for columns
  const getRoleSubRoleColumns = (): Array<{ roleId: string; roleName: string; subRole: SubRole }> => {
    const columns: Array<{ roleId: string; roleName: string; subRole: SubRole }> = [];
    roles.forEach(role => {
      role.subRoles.forEach(subRole => {
        columns.push({ roleId: role.id, roleName: role.name, subRole });
      });
    });
    return columns;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-6">
        <div className="w-full px-4">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Authority Matrix</h1>
              <p className="text-muted-foreground mt-1">
                Configure which roles can configure features for {productName}{productVersion ? ` - Version ${productVersion}` : ''}
              </p>
            </div>
          </div>

          {/* Role and Sub-Role Management */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Roles & Sub-Roles</CardTitle>
                  <CardDescription>
                    Manage roles and their sub-roles. Add roles and sub-roles to create columns in the matrix.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateSubRoleDialogOpen(true)}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Sub-Role
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roles.map((role) => (
                  <div key={role.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm">{role.name}</h3>
                      <span className="text-xs text-muted-foreground">
                        ({role.subRoles.length} sub-role{role.subRoles.length !== 1 ? 's' : ''})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {role.subRoles.map((subRole) => (
                        <div
                          key={subRole}
                          className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-md border border-primary/20"
                        >
                          <span className="text-sm font-medium">{subRole}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 text-destructive hover:text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                            onClick={() => handleDeleteSubRole(role.id, subRole)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Permissions Matrix */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration Permissions</CardTitle>
              <CardDescription>
                Configure which sub-roles can configure each feature for this product
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px] sticky left-0 bg-background z-10 text-center">Feature</TableHead>
                      {getRoleSubRoleColumns().map(({ roleId, roleName, subRole }) => (
                        <TableHead key={`${roleId}-${subRole}`} className="text-center align-middle w-[150px] min-w-[150px]">
                          <div className="flex flex-col items-center justify-center h-full py-2 text-center">
                            <div className="text-xs text-muted-foreground mb-1 text-center">{roleName}</div>
                            <div className="font-medium text-sm text-center">{subRole}</div>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
                      <React.Fragment key={category}>
                        <TableRow className="bg-primary/5">
                          <TableCell colSpan={getRoleSubRoleColumns().length + 1} className="font-semibold sticky left-0 bg-primary/5 z-10 text-center">
                            {category}
                          </TableCell>
                        </TableRow>
                        {categoryFeatures.map((feature) => (
                          <TableRow key={feature.id}>
                            <TableCell className="font-medium sticky left-0 bg-background z-10 text-center">
                              {feature.name}
                            </TableCell>
                            {getRoleSubRoleColumns().map(({ roleId, subRole }) => (
                              <TableCell key={`${roleId}-${subRole}`} className="text-center align-middle py-3">
                                <div className="flex flex-col gap-2 items-center justify-center">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Read</span>
                                    <Switch
                                      checked={matrix[feature.id]?.[roleId]?.[subRole]?.read || false}
                                      onCheckedChange={() => togglePermission(feature.id, roleId, subRole, 'read')}
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Write</span>
                                    <Switch
                                      checked={matrix[feature.id]?.[roleId]?.[subRole]?.write || false}
                                      onCheckedChange={() => togglePermission(feature.id, roleId, subRole, 'write')}
                                      disabled={!matrix[feature.id]?.[roleId]?.[subRole]?.read}
                                    />
                                  </div>
                                </div>
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Create Sub-Role Dialog */}
          <Dialog open={isCreateSubRoleDialogOpen} onOpenChange={setIsCreateSubRoleDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Sub-Role</DialogTitle>
                <DialogDescription>
                  Create a new sub-role for a role. This will add a new column to the permissions matrix.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Select Role</Label>
                  <Select
                    value={selectedRoleForSubRole}
                    onValueChange={(value) => setSelectedRoleForSubRole(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sub-Role Name</Label>
                  <Input
                    value={newSubRoleName}
                    onChange={(e) => setNewSubRoleName(e.target.value)}
                    placeholder="e.g., Broker Admin, Insurer Underwriter"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsCreateSubRoleDialogOpen(false);
                  setNewSubRoleName("");
                  setSelectedRoleForSubRole("");
                }}>
                  Cancel
                </Button>
                <Button onClick={handleCreateSubRole}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Sub-Role
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} className="gap-2" disabled={isSaving || isLoading || !productId}>
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save Authority Matrix"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthorityMatrix;


