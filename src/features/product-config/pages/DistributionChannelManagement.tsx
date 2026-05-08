import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Save, Users, Store, UserCheck, Plus, Trash2, CheckCircle2, Circle, Globe } from "lucide-react";
import { useToast } from '@/shared/hooks/use-toast';
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

type DistributionChannel = "BROKER" | "SALES_AGENT" | "AGENCY" | "DIRECT" | "ONLINE";
type PricingType = "PERCENTAGE" | "FIXED_AMOUNT";
type PricingDirection = "LOADING" | "DISCOUNT";

interface BrokerPricingConfig {
  id: string;
  brokerId: string;
  brokerName: string;
  brokerEmail: string;
  channelType: DistributionChannel;
  pricingType: PricingType; // PERCENTAGE or FIXED_AMOUNT
  pricingDirection: PricingDirection; // LOADING or DISCOUNT
  value: number; // The actual value (percentage or fixed amount)
  isActive: boolean;
}

interface Distributor {
  id: string;
  name: string;
  email: string;
  channelType: DistributionChannel;
}

const DistributionChannelManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const productName = searchParams.get("productName") || "";
  const productVersion = searchParams.get("productVersion") || "";
  const productId = searchParams.get("productId") || "";

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<DistributionChannel>("BROKER");

  // Broker pricing configurations
  const [brokerPricingConfigs, setBrokerPricingConfigs] = useState<BrokerPricingConfig[]>([]);

  // Mock distributors data
  const [distributors] = useState<Distributor[]>([
    { id: "d1", name: "Ahmed Al-Mansoori", email: "ahmed@broker.com", channelType: "BROKER" },
    { id: "d2", name: "Sarah Johnson", email: "sarah@broker.com", channelType: "BROKER" },
    { id: "d3", name: "Mohammed Hassan", email: "mohammed@broker.com", channelType: "BROKER" },
    { id: "d4", name: "Fatima Al-Zahra", email: "fatima@agent.com", channelType: "SALES_AGENT" },
    { id: "d5", name: "Ali Ahmad", email: "ali@agency.com", channelType: "AGENCY" },
    { id: "d6", name: "Omar Al-Rashid", email: "omar@direct.com", channelType: "DIRECT" },
    { id: "d7", name: "Online Portal", email: "online@company.com", channelType: "ONLINE" },
  ]);

  // Initialize broker pricing configs from distributors
  useEffect(() => {
    const initialConfigs: BrokerPricingConfig[] = distributors.map((dist) => ({
      id: `config-${dist.id}`,
      brokerId: dist.id,
      brokerName: dist.name,
      brokerEmail: dist.email,
      channelType: dist.channelType,
      pricingType: "PERCENTAGE",
      pricingDirection: "DISCOUNT",
      value: 0,
      isActive: true,
    }));
    setBrokerPricingConfigs(initialConfigs);
  }, []);

  const channelLabels: Record<DistributionChannel, string> = {
    BROKER: "Broker",
    SALES_AGENT: "Sales Agent",
    AGENCY: "Agency",
    DIRECT: "Direct",
    ONLINE: "Online (B2C)",
  };

  const getChannelIcon = (channelType: DistributionChannel) => {
    switch (channelType) {
      case "BROKER":
        return <Store className="w-5 h-5" />;
      case "SALES_AGENT":
        return <UserCheck className="w-5 h-5" />;
      case "AGENCY":
        return <Users className="w-5 h-5" />;
      case "DIRECT":
        return <UserCheck className="w-5 h-5" />;
      case "ONLINE":
        return <Globe className="w-5 h-5" />;
    }
  };

  const getDistributorsForChannel = (channelType: DistributionChannel): Distributor[] => {
    return distributors.filter((d) => d.channelType === channelType);
  };

  const getBrokerConfigsForChannel = (channelType: DistributionChannel): BrokerPricingConfig[] => {
    return brokerPricingConfigs.filter((config) => config.channelType === channelType);
  };

  const handlePricingTypeChange = (configId: string, pricingType: PricingType) => {
    setBrokerPricingConfigs((prev) =>
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
    setBrokerPricingConfigs((prev) =>
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
    setBrokerPricingConfigs((prev) =>
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

  const handleBrokerToggle = (configId: string, isActive: boolean) => {
    setBrokerPricingConfigs((prev) =>
      prev.map((config) => (config.id === configId ? { ...config, isActive } : config))
    );
    setIsSaved(false);
  };

  const calculateFinalPremium = (basePremium: number, config: BrokerPricingConfig): number => {
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
      // const response = await saveDistributionChannelConfig(productId, brokerPricingConfigs);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setIsSaved(true);
      toast({
        title: "Configuration Saved",
        description: "Distribution channel management configuration has been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save distribution channel configuration",
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
                <h1 className="text-2xl font-bold text-foreground">Distribution Channel Management</h1>
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

          {/* Channel Filter */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Distribution Channels</CardTitle>
              <CardDescription>
                System supports multiple distribution channels: Broker, Sales Agent, Agency, Direct, and Online (B2C).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                {(["BROKER", "SALES_AGENT", "AGENCY", "DIRECT", "ONLINE"] as DistributionChannel[]).map((channelType) => (
                  <Button
                    key={channelType}
                    variant={selectedChannel === channelType ? "default" : "outline"}
                    onClick={() => setSelectedChannel(channelType)}
                    className="gap-2"
                  >
                    {getChannelIcon(channelType)}
                    {channelLabels[channelType]}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Broker List with Pricing Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Broker Pricing Configuration</CardTitle>
              <CardDescription>
                Configure loading or discount (percentage or fixed amount) for each broker in the {channelLabels[selectedChannel]} channel.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Broker Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Loading/Discount</TableHead>
                    <TableHead>Percentage/Fixed</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Example (Base: AED 1,000)</TableHead>
                    <TableHead>Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getBrokerConfigsForChannel(selectedChannel).map((config) => (
                    <TableRow key={config.id}>
                      <TableCell className="font-medium">{config.brokerName}</TableCell>
                      <TableCell>{config.brokerEmail}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{channelLabels[config.channelType]}</Badge>
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
                          onCheckedChange={(checked) => handleBrokerToggle(config.id, checked)}
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

export default DistributionChannelManagement;

