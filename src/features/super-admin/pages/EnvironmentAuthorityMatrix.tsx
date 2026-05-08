import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Users, Building2, Shield, Globe } from "lucide-react";
import { useToast } from '@/shared/hooks/use-toast';
import { Label } from "@/components/ui/label";
import {
  getEnvironmentAuthorityMatrix,
  updateEnvironmentAuthorityMatrix,
} from '@/features/super-admin/api/super-admin';

// API Response Types
interface ApiRole {
  id: string;
  name: string;
}

interface ApiPermission {
  id: string;
  name: string;
  category: string;
  description: string;
  categoryOrder?: number;
  order?: number;
}

interface ApiAuthorityMatrixResponse {
  id: string;
  roles: ApiRole[];
  permissions: ApiPermission[];
  matrix: {
    [roleId: string]: {
      [permissionId: string]: boolean;
    };
  };
  createdAt: string;
  updatedAt: string;
}

const roleIconMap: Record<string, typeof Users> = {
  marketAdmin: Users,
  insurer: Building2,
  reinsurer: Shield,
  broker: Users,
};

const EnvironmentAuthorityMatrix = () => {
  const { environmentId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apiData, setApiData] = useState<ApiAuthorityMatrixResponse | null>(null);
  const [roles, setRoles] = useState<Array<{ id: string; name: string; icon: typeof Users }>>([]);
  const [permissions, setPermissions] = useState<ApiPermission[]>([]);
  const [matrix, setMatrix] = useState<{ [roleId: string]: { [permissionId: string]: boolean } }>(
    {},
  );
  const [environmentName, setEnvironmentName] = useState<string>("");

  // Fetch authority matrix list from API
  useEffect(() => {
    const fetchAuthorityMatrix = async () => {
      if (!environmentId) return;
      try {
        setIsLoading(true);
        const response = await getEnvironmentAuthorityMatrix(environmentId);

        const data = Array.isArray(response) ? response[0] : response;

        if (data) {
          setApiData(data);

          const rolesArray = Array.isArray(data.roles) ? data.roles : [];
          const mappedRoles = rolesArray.map((role) => ({
            id: role.id,
            name: role.name,
            icon: roleIconMap[role.id] || Users,
          }));
          setRoles(mappedRoles);

          const matrixData = data.matrix || {};
          setMatrix(matrixData);

          setPermissions(Array.isArray(data.permissions) ? data.permissions : []);

          setEnvironmentName(`Environment ${environmentId}`);
        }
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          "Failed to load authority matrix. Please try again.";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuthorityMatrix();
  }, [environmentId, toast]);

  const handlePermissionChange = (roleId: string, permissionId: string, value: boolean) => {
    setMatrix((prev) => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        [permissionId]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!environmentId) return;

    try {
      setIsSaving(true);

      const requestBody = {
        matrix,
      };

      await updateEnvironmentAuthorityMatrix(environmentId, requestBody);

      toast({
        title: "Authority Matrix Updated",
        description: "Access permissions have been saved successfully.",
      });

      const response = await getEnvironmentAuthorityMatrix(environmentId);
      const data = Array.isArray(response) ? response[0] : response;
      if (data) {
        const matrixData = data.matrix || {};
        setMatrix(matrixData);

        if (Array.isArray(data.roles)) {
          const mappedRoles = data.roles.map((role) => ({
            id: role.id,
            name: role.name,
            icon: roleIconMap[role.id] || Users,
          }));
          setRoles(mappedRoles);
        }

        setPermissions(Array.isArray(data.permissions) ? data.permissions : []);
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to save authority matrix. Please try again.";
      toast({
        title: "Save Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getPermissionValue = (roleId: string, permissionId: string): boolean => {
    return matrix[roleId]?.[permissionId] || false;
  };

  const groupedPermissions = Array.isArray(permissions)
    ? permissions.reduce((acc, permission) => {
        if (!acc[permission.category]) {
          acc[permission.category] = [];
        }
        acc[permission.category].push(permission);
        return acc;
      }, {} as Record<string, ApiPermission[]>)
    : {};

  Object.keys(groupedPermissions).forEach((category) => {
    groupedPermissions[category].sort((a, b) => {
      const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex flex-col">
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="sm" onClick={() => navigate("/super-admin/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Authority Matrix</h1>
              <p className="text-lg text-muted-foreground">
                Configure access permissions for {environmentName || "Environment"}
              </p>
            </div>
          </div>

          {/* Environment Info */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-semibold">
                    {environmentName || `Environment ${environmentId}`}
                  </p>
                  <p className="text-sm text-muted-foreground">Environment ID: {environmentId}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Authority Matrix Table */}
          <Card>
            <CardHeader>
              <CardTitle>Access Permissions Matrix</CardTitle>
              <CardDescription>
                Configure which roles have access to specific permissions in this environment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading authority matrix...
                </div>
              ) : !apiData ? (
                <div className="text-center py-8 text-muted-foreground">
                  No authority matrix data found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px] sticky left-0 bg-background z-10">
                          Permission
                        </TableHead>
                        {roles.map((role) => {
                          const IconComponent = role.icon;
                          return (
                            <TableHead
                              key={role.id}
                              className="text-center align-middle w-[150px] min-w-[150px]"
                            >
                              <div className="flex flex-col items-center justify-center h-full py-2">
                                <IconComponent className="w-5 h-5 mb-1 text-primary" />
                                <div className="font-medium text-sm">{role.name}</div>
                              </div>
                            </TableHead>
                          );
                        })}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(groupedPermissions)
                        .sort(([catA, permsA], [catB, permsB]) => {
                          const orderA = permsA[0]?.categoryOrder ?? Number.MAX_SAFE_INTEGER;
                          const orderB = permsB[0]?.categoryOrder ?? Number.MAX_SAFE_INTEGER;

                          if (orderA !== orderB) {
                            return orderA - orderB;
                          }
                          return catA.localeCompare(catB);
                        })
                        .map(([category, categoryPermissions]) => (
                          <React.Fragment key={category}>
                            <TableRow className="bg-muted/50">
                              <TableCell
                                colSpan={roles.length + 1}
                                className="font-semibold sticky left-0 bg-muted/50 z-10"
                              >
                                {category}
                              </TableCell>
                            </TableRow>
                            {categoryPermissions.map((permission) => (
                              <TableRow key={permission.id}>
                                <TableCell className="font-medium sticky left-0 bg-background z-10">
                                  <div>
                                    <div className="font-semibold">{permission.name}</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {permission.description}
                                    </div>
                                  </div>
                                </TableCell>
                                {roles.map((role) => (
                                  <TableCell
                                    key={`${role.id}-${permission.id}`}
                                    className="text-center align-middle py-3"
                                  >
                                    <Switch
                                      checked={getPermissionValue(role.id, permission.id)}
                                      onCheckedChange={(checked) =>
                                        handlePermissionChange(role.id, permission.id, checked)
                                      }
                                    />
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </React.Fragment>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4 mt-6">
            <Button variant="outline" onClick={() => navigate("/super-admin/dashboard")}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentAuthorityMatrix;
