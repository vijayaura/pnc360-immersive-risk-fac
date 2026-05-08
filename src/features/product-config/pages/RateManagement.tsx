import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Save, UserCheck, Shield, CheckCircle2 } from "lucide-react";
import { useToast } from '@/shared/hooks/use-toast';
import { Switch } from "@/components/ui/switch";

type UserRole = "BRM" | "UNDERWRITER";
type PricingType = "PERCENTAGE" | "FIXED_AMOUNT";
type PricingDirection = "LOADING" | "DISCOUNT";

interface RolePricingConfig {
  id: string;
  role: UserRole;
  pricingType: PricingType; // PERCENTAGE or FIXED_AMOUNT
  pricingDirection: PricingDirection; // LOADING or DISCOUNT
  value: number; // The actual value (percentage or fixed amount)
  isActive: boolean;
}

const RateManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const productName = searchParams.get("productName") || "";
  const productVersion = searchParams.get("productVersion") || "";
  const productId = searchParams.get("productId") || "";

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Role pricing configurations
  const [rolePricingConfigs, setRolePricingConfigs] = useState<RolePricingConfig[]>([
    {
      id: "config-brm",
      role: "BRM",
      pricingType: "PERCENTAGE",
      pricingDirection: "DISCOUNT",
      value: 0,
      isActive: true,
    },
    {
      id: "config-underwriter",
      role: "UNDERWRITER",
      pricingType: "PERCENTAGE",
      pricingDirection: "DISCOUNT",
      value: 0,
      isActive: true,
    },
  ]);

  const roleLabels: Record<UserRole, string> = {
    BRM: "BRM (Broker Relationship Manager)",
    UNDERWRITER: "Underwriter",
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "BRM":
        return <UserCheck className="w-5 h-5" />;
      case "UNDERWRITER":
        return <Shield className="w-5 h-5" />;
    }
  };

  const handlePricingTypeChange = (configId: string, pricingType: PricingType) => {
    setRolePricingConfigs((prev) =>
      prev.map((config) =>
        config.id === configId
          ? {
              ...config,
              pricingType,
              value: 0, // Reset value when changing type
            }
          : config
      )
    );
    setIsSaved(false);
  };

  const handlePricingDirectionChange = (configId: string, direction: PricingDirection) => {
    setRolePricingConfigs((prev) =>
      prev.map((config) =>
        config.id === configId
          ? {
              ...config,
              pricingDirection: direction,
            }
          : config
      )
    );
    setIsSaved(false);
  };

  const handleValueChange = (configId: string, value: number) => {
    setRolePricingConfigs((prev) =>
      prev.map((config) =>
        config.id === configId
          ? {
              ...config,
              value,
            }
          : config
      )
    );
    setIsSaved(false);
  };

  const handleRoleToggle = (configId: string, isActive: boolean) => {
    setRolePricingConfigs((prev) =>
      prev.map((config) => (config.id === configId ? { ...config, isActive } : config))
    );
    setIsSaved(false);
  };

  const calculateFinalPremium = (basePremium: number, config: RolePricingConfig): number => {
    if (!config.isActive) return basePremium;

    let finalPremium = basePremium;

    if (config.pricingType === "PERCENTAGE") {
      if (config.pricingDirection === "LOADING") {
        finalPremium = finalPremium * (1 + config.value / 100);
      } else {
        // DISCOUNT
        finalPremium = finalPremium * (1 - config.value / 100);
      }
    } else {
      // FIXED_AMOUNT
      if (config.pricingDirection === "LOADING") {
        finalPremium = finalPremium + config.value;
      } else {
        // DISCOUNT
        finalPremium = finalPremium - config.value;
      }
    }

    return Math.max(0, finalPremium); // Ensure non-negative
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // TODO: Save to API
      // const response = await saveRateManagementConfig(productId, rolePricingConfigs);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setIsSaved(true);
      toast({
        title: "Configuration Saved",
        description: "Rate management configuration has been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save rate management configuration",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 overflow-auto">
        <div className="w-full px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Rate Management</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {productName}
                  {productVersion && ` - Version ${productVersion}`}
                </p>
              </div>
            </div>
            <Button onClick={handleSave} className="gap-2" disabled={isSaving || isSaved}>
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : isSaved ? "Saved" : "Save Configuration"}
            </Button>
          </div>

          {/* Role-based Pricing Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rate Adjustment Configuration</CardTitle>
              <CardDescription>
                Configure loading or discount (percentage or fixed amount) for Underwriter and BRM roles to adjust prices.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Loading/Discount</TableHead>
                    <TableHead>Percentage/Fixed</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Example (Base: AED 1,000)</TableHead>
                    <TableHead>Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rolePricingConfigs.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getRoleIcon(config.role)}
                          {roleLabels[config.role]}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={config.pricingDirection}
                          onValueChange={(value) =>
                            handlePricingDirectionChange(config.id, value as PricingDirection)
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LOADING">Loading</SelectItem>
                            <SelectItem value="DISCOUNT">Discount</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={config.pricingType}
                          onValueChange={(value) => handlePricingTypeChange(config.id, value as PricingType)}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                            <SelectItem value="FIXED_AMOUNT">Fixed Amount</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={config.value}
                          onChange={(e) => handleValueChange(config.id, parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          step={config.pricingType === "PERCENTAGE" ? "0.1" : "1"}
                          className="w-24"
                        />
                        <span className="ml-2 text-sm text-muted-foreground">
                          {config.pricingType === "PERCENTAGE" ? "%" : "AED"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="text-muted-foreground">Base: AED 1,000</div>
                          <div className="font-medium text-primary">
                            Final: AED {calculateFinalPremium(1000, config).toFixed(2)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={config.isActive}
                          onCheckedChange={(checked) => handleRoleToggle(config.id, checked)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RateManagement;

